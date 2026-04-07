import { db } from "#/db/index";
import {
	trackers,
	receivedItems,
	apDatapackage,
	notificationConfigs,
} from "#/db/schema";
import { eq, and } from "drizzle-orm";
import {
	fetchRoomStatus,
	fetchStaticTracker,
	fetchDatapackage,
	fetchTracker,
	sendDiscordWebhook,
	flagRarity,
	type GameData,
	type DatapackageResponse,
} from "#/lib/archipelago";

// ─── Datapackage cache (uses DB) ───

async function getOrFetchDatapackage(
	gameName: string,
	checksum: string,
): Promise<DatapackageResponse> {
	// Check DB cache first
	const cached = db
		.select()
		.from(apDatapackage)
		.where(eq(apDatapackage.checksum, checksum))
		.get();

	if (cached) {
		return JSON.parse(cached.data) as DatapackageResponse;
	}

	// Fetch from API
	const data = await fetchDatapackage(checksum);

	// Store in DB
	db.insert(apDatapackage)
		.values({
			checksum,
			gameName,
			data: JSON.stringify(data),
		})
		.onConflictDoNothing()
		.run();

	return data;
}

function buildGameData(
	gameName: string,
	datapackage: DatapackageResponse,
): GameData {
	const idToItemName = new Map<string, string>();
	const idToLocationName = new Map<string, string>();

	for (const [name, id] of Object.entries(datapackage.item_name_to_id)) {
		idToItemName.set(String(id), name);
	}
	for (const [name, id] of Object.entries(datapackage.location_name_to_id)) {
		idToLocationName.set(String(id), name);
	}

	return { name: gameName, idToItemName, idToLocationName };
}

// ─── Check if item was already received ───

function isItemAlreadyReceived(
	trackerId: number,
	slotId: string,
	itemId: string,
): boolean {
	const existing = db
		.select()
		.from(receivedItems)
		.where(
			and(
				eq(receivedItems.trackerId, trackerId),
				eq(receivedItems.slotId, slotId),
				eq(receivedItems.itemId, itemId),
			),
		)
		.get();

	return !!existing;
}

function markItemReceived(
	trackerId: number,
	slotId: string,
	itemId: string,
): void {
	db.insert(receivedItems)
		.values({ trackerId, slotId, itemId })
		.onConflictDoNothing()
		.run();
}

// ─── Main refresh for a single tracker ───

export async function refreshTracker(
	tracker: typeof trackers.$inferSelect,
): Promise<void> {
	console.log(`[polling] Refreshing tracker "${tracker.name}" (id=${tracker.id})`);

	try {
		// 1. Get room status to resolve tracker ID and player names
		const roomStatus = await fetchRoomStatus(tracker.roomId);
		const resolvedTrackerId = tracker.trackerId || roomStatus.tracker;

		// Update tracker ID if we just resolved it
		if (!tracker.trackerId && resolvedTrackerId) {
			db.update(trackers)
				.set({ trackerId: resolvedTrackerId })
				.where(eq(trackers.id, tracker.id))
				.run();
		}

		if (!resolvedTrackerId) {
			console.log(`[polling] No tracker ID found for room ${tracker.roomId}, skipping`);
			return;
		}

		// Build player names map
		const playerNames = new Map<string, string>();
		for (let i = 0; i < roomStatus.players.length; i++) {
			playerNames.set(String(i + 1), roomStatus.players[i][0]);
		}

		// 2. Get static tracker for game/player mapping and datapackage checksums
		const staticTracker = await fetchStaticTracker(resolvedTrackerId);

		const playerGame = new Map<string, string>();
		for (const pg of staticTracker.player_game) {
			playerGame.set(String(pg.player), pg.game);
		}

		// 3. Fetch datapackages for all games
		const games = new Map<string, GameData>();
		for (const [gameName, dpInfo] of Object.entries(
			staticTracker.datapackage,
		)) {
			const dpData = await getOrFetchDatapackage(gameName, dpInfo.checksum);
			games.set(gameName, buildGameData(gameName, dpData));
		}

		// 4. Fetch current tracker data
		const trackerData = await fetchTracker(resolvedTrackerId);

		// 5. Get notification configs for this tracker
		const configs = db
			.select()
			.from(notificationConfigs)
			.where(
				and(
					eq(notificationConfigs.trackerId, tracker.id),
					eq(notificationConfigs.enabled, true),
				),
			)
			.all();

		// 6. Parse tracked slot IDs
		const trackedSlots = tracker.slotIds.split(",").map((s) => s.trim());

		// 7. Process each player's received items
		for (const playerItems of trackerData.player_items_received) {
			const playerId = String(playerItems.player);

			if (!trackedSlots.includes(playerId)) continue;

			const gameName = playerGame.get(playerId);
			if (!gameName) continue;

			const game = games.get(gameName);
			if (!game) continue;

			for (const itemData of playerItems.items) {
				const itemId = String(itemData[0]);
				const locationId = String(itemData[1]);
				const sentByPlayerId = String(itemData[2]);
				const flagId = itemData[3];

				// Skip already processed items
				if (isItemAlreadyReceived(tracker.id, playerId, itemId)) continue;

				// Mark as received
				markItemReceived(tracker.id, playerId, itemId);

				// Skip self-found items unless configured otherwise
				const isSelfFound = sentByPlayerId === playerId;

				// Resolve names
				const playerName = playerNames.get(playerId) || `Player ${playerId}`;
				const sentByName =
					playerNames.get(sentByPlayerId) || `Player ${sentByPlayerId}`;
				const itemName = game.idToItemName.get(itemId) || `Item ${itemId}`;

				let locationName = `Location ${locationId}`;
				const senderGameName = playerGame.get(sentByPlayerId);
				if (senderGameName) {
					const senderGame = games.get(senderGameName);
					if (senderGame) {
						locationName =
							senderGame.idToLocationName.get(locationId) ||
							`Location ${locationId}`;
					}
				}

				// Send notifications based on each config's settings
				for (const config of configs) {
					if (isSelfFound && !config.notifySelfFound) continue;

					const shouldNotify =
						(flagId === 1 && config.notifyProgression) ||
						(flagId === 2 && config.notifyUseful) ||
						(flagId === 3 && config.notifyProgression) ||
						(flagId >= 4 && flagId <= 7 && config.notifyTraps) ||
						(flagId === 0 && config.notifyNormal);

					if (!shouldNotify) continue;

					const title = `${playerName} - Received ${itemName} (${flagRarity(flagId)})`;
					const message = `Location: ${locationName}\nSent by ${sentByName}`;

					try {
						if (config.provider === "discord_webhook") {
							await sendDiscordWebhook(
								config.webhookUrl,
								title,
								message,
								flagId,
							);
						}
					} catch (err) {
						console.error(
							`[polling] Failed to send notification (config=${config.id}):`,
							err,
						);
					}

					// Small delay between webhook calls
					await new Promise((r) => setTimeout(r, 300));
				}
			}
		}

		console.log(`[polling] Tracker "${tracker.name}" refreshed successfully`);
	} catch (err) {
		console.error(`[polling] Error refreshing tracker "${tracker.name}":`, err);
	}
}

// ─── Poll all enabled trackers ───

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export function startPolling(intervalMs = 60_000): void {
	if (pollingInterval) return; // already running

	console.log(`[polling] Starting polling loop (interval=${intervalMs}ms)`);

	// Run immediately once, then on interval
	void pollAllTrackers();

	pollingInterval = setInterval(() => {
		void pollAllTrackers();
	}, intervalMs);
}

export function stopPolling(): void {
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
		console.log("[polling] Polling stopped");
	}
}

async function pollAllTrackers(): Promise<void> {
	const enabledTrackers = db
		.select()
		.from(trackers)
		.where(eq(trackers.enabled, true))
		.all();

	if (enabledTrackers.length === 0) return;

	console.log(`[polling] Polling ${enabledTrackers.length} tracker(s)...`);

	for (const tracker of enabledTrackers) {
		await refreshTracker(tracker);
		// Delay between trackers to avoid rate limiting
		await new Promise((r) => setTimeout(r, 1000));
	}
}
