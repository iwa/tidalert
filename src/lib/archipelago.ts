// Archipelago API types and utilities

const AP_BASE_URL = "https://archipelago.gg/api";

// ─── API Response Types ───

export interface RoomStatusResponse {
	last_activity: string;
	last_port: number;
	players: string[][];
	timeout: number;
	tracker: string;
}

export interface StaticTrackerResponse {
	datapackage: Record<string, { checksum: string; version: number }>;
	player_game: { game: string; player: number; team: number }[];
}

export interface DatapackageResponse {
	checksum: string;
	item_name_groups: Record<string, string[]>;
	item_name_to_id: Record<string, number>;
	location_name_groups: Record<string, string[]>;
	location_name_to_id: Record<string, number>;
}

export interface TrackerResponse {
	player_items_received: {
		items: number[][];
		player: number;
		team: number;
	}[];
}

// ─── Parsed types used internally ───

export interface GameData {
	name: string;
	idToItemName: Map<string, string>;
	idToLocationName: Map<string, string>;
}

export interface TrackerState {
	playerNames: Map<string, string>; // player id -> player name
	playerGame: Map<string, string>; // player id -> game name
	games: Map<string, GameData>; // game name -> game data
}

// ─── Flag rarity helpers ───

export function flagRarity(flagId: number): string {
	switch (flagId) {
		case 0:
			return "normal";
		case 1:
			return "progression";
		case 2:
			return "useful";
		case 3:
			return "progression + useful";
		case 4:
		case 5:
		case 6:
		case 7:
			return "trap";
		default:
			return "unknown";
	}
}

export function flagColor(flagId: number): number {
	switch (flagId) {
		case 1:
			return 0xaf99ef; // purple for progression
		case 2:
			return 0x6d8be8; // blue for useful
		case 3:
			return 0xaf99ef; // purple for progression + useful
		case 4:
		case 5:
		case 6:
		case 7:
			return 0xe74c3c; // red for traps
		default:
			return 0x95a5a6; // gray for normal
	}
}

// ─── API Fetchers ───

export async function fetchRoomStatus(
	roomId: string,
): Promise<RoomStatusResponse> {
	const resp = await fetch(`${AP_BASE_URL}/room_status/${roomId}`);
	if (!resp.ok) throw new Error(`Failed to fetch room status: ${resp.status}`);
	return resp.json();
}

export async function fetchStaticTracker(
	trackerId: string,
): Promise<StaticTrackerResponse> {
	const resp = await fetch(`${AP_BASE_URL}/static_tracker/${trackerId}`);
	if (!resp.ok)
		throw new Error(`Failed to fetch static tracker: ${resp.status}`);
	return resp.json();
}

export async function fetchDatapackage(
	checksum: string,
): Promise<DatapackageResponse> {
	const resp = await fetch(`${AP_BASE_URL}/datapackage/${checksum}`);
	if (!resp.ok) throw new Error(`Failed to fetch datapackage: ${resp.status}`);
	return resp.json();
}

export async function fetchTracker(
	trackerId: string,
): Promise<TrackerResponse> {
	const resp = await fetch(`${AP_BASE_URL}/tracker/${trackerId}`);
	if (!resp.ok) throw new Error(`Failed to fetch tracker: ${resp.status}`);
	return resp.json();
}

// ─── Discord Webhook ───

export async function sendDiscordWebhook(
	webhookUrl: string,
	title: string,
	message: string,
	flagId: number,
): Promise<void> {
	const embed = {
		title,
		description: message,
		color: flagColor(flagId),
		timestamp: new Date().toISOString(),
	};

	const resp = await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ embeds: [embed] }),
	});

	if (!resp.ok) {
		throw new Error(`Discord webhook failed: ${resp.status}`);
	}
}
