import { createServerFn } from "@tanstack/react-start";
import { fetchRoomStatus } from "#/lib/archipelago";
import { getAuthSession } from "./authSession";
import { refreshTracker } from "./polling";
import { db } from "#/db/index";
import { trackers } from "#/db/schema";
import { eq, and } from "drizzle-orm";

export const validateRoom = createServerFn({ method: "POST" })
  .inputValidator((data: { roomId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    try {
      const roomStatus = await fetchRoomStatus(data.roomId);
      return {
        valid: true,
        trackerId: roomStatus.tracker,
        players: roomStatus.players.map((p, i) => ({
          slotId: String(i + 1),
          name: p[0],
        })),
      };
    } catch {
      return { valid: false, trackerId: null, players: [] };
    }
  });

export const triggerRefresh = createServerFn({ method: "POST" })
  .inputValidator((data: { trackerId: number }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    const tracker = db
      .select()
      .from(trackers)
      .where(
        and(
          eq(trackers.id, data.trackerId),
          eq(trackers.userId, session.user.id),
        ),
      )
      .get();

    if (!tracker) throw new Error("Tracker not found");

    await refreshTracker(tracker);
    return { success: true };
  });
