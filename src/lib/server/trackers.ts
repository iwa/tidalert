import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { trackers, notificationConfigs, receivedItems } from "#/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "./authSession";

// ─── Tracker CRUD ───

export const getTrackers = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    return db
      .select()
      .from(trackers)
      .where(eq(trackers.userId, session.user.id));
  },
);

export const createTracker = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      roomId: string;
      slotIds: string;
      periodMinutes?: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    const result = db
      .insert(trackers)
      .values({
        userId: session.user.id,
        name: data.name,
        roomId: data.roomId,
        slotIds: data.slotIds,
        periodMinutes: data.periodMinutes ?? 60,
      })
      .returning()
      .get();

    return result;
  });

export const updateTracker = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: number;
      name?: string;
      roomId?: string;
      slotIds?: string;
      periodMinutes?: number;
      enabled?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updates } = data;

    const result = db
      .update(trackers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(trackers.id, id), eq(trackers.userId, session.user.id)))
      .returning()
      .get();

    return result;
  });

export const deleteTracker = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    db.delete(trackers)
      .where(
        and(eq(trackers.id, data.id), eq(trackers.userId, session.user.id)),
      )
      .run();

    return { success: true };
  });

// ─── Notification Config CRUD ───

export const getNotificationConfigs = createServerFn({ method: "GET" })
  .inputValidator((data: { trackerId: number }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    return db
      .select()
      .from(notificationConfigs)
      .where(
        and(
          eq(notificationConfigs.trackerId, data.trackerId),
          eq(notificationConfigs.userId, session.user.id),
        ),
      );
  });

export const getAllNotificationConfigs = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  return db
    .select()
    .from(notificationConfigs)
    .where(eq(notificationConfigs.userId, session.user.id));
});

export const createNotificationConfig = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      trackerId: number;
      webhookUrl: string;
      notifyProgression?: boolean;
      notifyUseful?: boolean;
      notifyTraps?: boolean;
      notifyNormal?: boolean;
      notifySelfFound?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    // Verify the tracker belongs to the user
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

    const result = db
      .insert(notificationConfigs)
      .values({
        userId: session.user.id,
        trackerId: data.trackerId,
        provider: "discord_webhook",
        webhookUrl: data.webhookUrl,
        notifyProgression: data.notifyProgression ?? true,
        notifyUseful: data.notifyUseful ?? true,
        notifyTraps: data.notifyTraps ?? false,
        notifyNormal: data.notifyNormal ?? false,
        notifySelfFound: data.notifySelfFound ?? false,
      })
      .returning()
      .get();

    return result;
  });

export const updateNotificationConfig = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: number;
      webhookUrl?: string;
      enabled?: boolean;
      notifyProgression?: boolean;
      notifyUseful?: boolean;
      notifyTraps?: boolean;
      notifyNormal?: boolean;
      notifySelfFound?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    const { id, ...updates } = data;

    const result = db
      .update(notificationConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(notificationConfigs.id, id),
          eq(notificationConfigs.userId, session.user.id),
        ),
      )
      .returning()
      .get();

    return result;
  });

export const deleteNotificationConfig = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    db.delete(notificationConfigs)
      .where(
        and(
          eq(notificationConfigs.id, data.id),
          eq(notificationConfigs.userId, session.user.id),
        ),
      )
      .run();

    return { success: true };
  });

// ─── Received Items (read-only for dashboard) ───

export const getReceivedItemsCount = createServerFn({ method: "GET" })
  .inputValidator((data: { trackerId: number }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    const items = db
      .select()
      .from(receivedItems)
      .where(eq(receivedItems.trackerId, data.trackerId))
      .all();

    return items.length;
  });
