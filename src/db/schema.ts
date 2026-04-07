import {
  sqliteTable,
  integer,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Better Auth

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// App

export const trackers = sqliteTable("trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  roomId: text("room_id").notNull(),
  trackerId: text("tracker_id"),
  slotIds: text("slot_ids").notNull(), // comma-separated slot IDs
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const receivedItems = sqliteTable(
  "received_items",
  {
    trackerId: integer("tracker_id")
      .notNull()
      .references(() => trackers.id, { onDelete: "cascade" }),
    slotId: text("slot_id").notNull(),
    itemId: text("item_id").notNull(),
    notifiedAt: integer("notified_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => [
    primaryKey({ columns: [table.trackerId, table.slotId, table.itemId] }),
  ],
);

export const apDatapackage = sqliteTable("ap_datapackage", {
  checksum: text("checksum").primaryKey(),
  gameName: text("game_name").notNull(),
  data: text("data").notNull(), // JSON string of the full datapackage response
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const notificationConfigs = sqliteTable("notification_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  trackerId: integer("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("discord_webhook"), // for now only discord_webhook
  webhookUrl: text("webhook_url").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  notifyProgression: integer("notify_progression", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyUseful: integer("notify_useful", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});
