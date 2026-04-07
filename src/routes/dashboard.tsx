import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  Settings,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  getTrackers,
  createTracker,
  deleteTracker,
  updateTracker,
  getAllNotificationConfigs,
  createNotificationConfig,
  deleteNotificationConfig,
  updateNotificationConfig,
} from "#/lib/server/trackers";
import { validateRoom, triggerRefresh } from "#/lib/server/ap-api";
import { getAuthSession } from "#/lib/server/authSession";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
    return { session };
  },
  loader: async () => {
    const [trackersData, notifConfigs] = await Promise.all([
      getTrackers(),
      getAllNotificationConfigs(),
    ]);
    return { trackers: trackersData, notifConfigs };
  },
  component: Dashboard,
});

function Dashboard() {
  const { session } = Route.useRouteContext();
  const { trackers: initialTrackers, notifConfigs: initialNotifConfigs } =
    Route.useLoaderData();

  const [trackersList, setTrackersList] = useState(initialTrackers);
  const [notifConfigs, setNotifConfigs] = useState(initialNotifConfigs);
  const [expandedTracker, setExpandedTracker] = useState<number | null>(null);
  const [showAddTracker, setShowAddTracker] = useState(false);
  const [showAddNotif, setShowAddNotif] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  // Sync with loader data on navigation
  useEffect(() => {
    setTrackersList(initialTrackers);
    setNotifConfigs(initialNotifConfigs);
  }, [initialTrackers, initialNotifConfigs]);

  const reloadData = async () => {
    const [t, n] = await Promise.all([
      getTrackers(),
      getAllNotificationConfigs(),
    ]);
    setTrackersList(t);
    setNotifConfigs(n);
  };

  const handleRefresh = async (trackerId: number) => {
    setRefreshingId(trackerId);
    try {
      await triggerRefresh({ data: { trackerId } });
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Welcome back, {session.user.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddTracker(true)}
          className="flex items-center gap-2 rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
        >
          <Plus className="h-4 w-4" />
          Add Tracker
        </button>
      </div>

      {showAddTracker && (
        <AddTrackerForm
          onClose={() => setShowAddTracker(false)}
          onCreated={reloadData}
        />
      )}

      {trackersList.length === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center">
          <Gamepad2Icon className="mx-auto mb-4 h-12 w-12 text-[var(--sea-ink-soft)] opacity-40" />
          <p className="text-[var(--sea-ink-soft)]">
            No trackers yet. Add one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trackersList.map((tracker) => {
            const configs = notifConfigs.filter(
              (c) => c.trackerId === tracker.id,
            );
            const isExpanded = expandedTracker === tracker.id;

            return (
              <div
                key={tracker.id}
                className="island-shell overflow-hidden rounded-2xl"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-[var(--sea-ink)]">
                        {tracker.name}
                      </h3>
                      {tracker.enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                      Room: {tracker.roomId} | Slots: {tracker.slotIds} |
                      Period: {tracker.periodMinutes}min
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={
                        tracker.enabled ? "Pause tracker" : "Enable tracker"
                      }
                      onClick={async () => {
                        await updateTracker({
                          data: {
                            id: tracker.id,
                            enabled: !tracker.enabled,
                          },
                        });
                        await reloadData();
                      }}
                      className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                    >
                      {tracker.enabled ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Refresh now"
                      disabled={refreshingId === tracker.id}
                      onClick={() => handleRefresh(tracker.id)}
                      className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshingId === tracker.id ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Delete tracker"
                      onClick={async () => {
                        if (
                          !confirm(
                            `Delete tracker "${tracker.name}"? This will also delete all notification configs and received items history.`,
                          )
                        )
                          return;
                        await deleteTracker({ data: { id: tracker.id } });
                        await reloadData();
                      }}
                      className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTracker(isExpanded ? null : tracker.id)
                      }
                      className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--line)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--sea-ink)]">
                        <Bell className="h-4 w-4" />
                        Notification Configs
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddNotif(tracker.id)}
                        className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                      >
                        <Plus className="h-3 w-3" />
                        Add Webhook
                      </button>
                    </div>

                    {showAddNotif === tracker.id && (
                      <AddNotificationForm
                        trackerId={tracker.id}
                        onClose={() => setShowAddNotif(null)}
                        onCreated={reloadData}
                      />
                    )}

                    {configs.length === 0 ? (
                      <p className="text-xs text-[var(--sea-ink-soft)]">
                        No notification configs. Add a Discord webhook to get
                        notified.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {configs.map((config) => (
                          <NotificationConfigCard
                            key={config.id}
                            config={config}
                            onUpdated={reloadData}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

// ─── Subcomponents ───

function Gamepad2Icon({ className }: { className?: string }) {
  return <Settings className={className} />;
}

function AddTrackerForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [slotIds, setSlotIds] = useState("");
  const [periodMinutes, setPeriodMinutes] = useState(60);
  const [validating, setValidating] = useState(false);
  const [players, setPlayers] = useState<
    { slotId: string; name: string }[] | null
  >(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    setError("");
    setPlayers(null);
    try {
      const result = await validateRoom({ data: { roomId } });
      if (result.valid) {
        setPlayers(result.players);
      } else {
        setError("Invalid room ID or room not found.");
      }
    } catch {
      setError("Failed to validate room.");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name || !roomId || !slotIds) return;
    setSubmitting(true);
    try {
      await createTracker({
        data: { name, roomId, slotIds, periodMinutes },
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError("Failed to create tracker.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="island-shell mb-4 rounded-2xl p-5">
      <h3 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">
        Add New Tracker
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
            Tracker Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Multiworld"
            required
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
            Room ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="abc123-def456-..."
              required
              className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none"
            />
            <button
              type="button"
              disabled={!roomId || validating}
              onClick={handleValidate}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              {validating ? "Checking..." : "Validate"}
            </button>
          </div>
        </div>

        {players && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--sea-ink)]">
              Players in this room (click to add slot IDs):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => {
                const isSelected = slotIds
                  .split(",")
                  .map((s) => s.trim())
                  .includes(p.slotId);
                return (
                  <button
                    key={p.slotId}
                    type="button"
                    onClick={() => {
                      const current = slotIds
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (isSelected) {
                        setSlotIds(
                          current.filter((id) => id !== p.slotId).join(", "),
                        );
                      } else {
                        setSlotIds([...current, p.slotId].join(", "));
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? "border border-[var(--lagoon)] bg-[rgba(79,184,178,0.2)] text-[var(--lagoon-deep)]"
                        : "border border-[var(--line)] text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]"
                    }`}
                  >
                    #{p.slotId} {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
            Slot IDs (comma-separated)
          </label>
          <input
            type="text"
            value={slotIds}
            onChange={(e) => setSlotIds(e.target.value)}
            placeholder="1, 3, 5"
            required
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
            Polling Period (minutes)
          </label>
          <input
            type="number"
            value={periodMinutes}
            onChange={(e) => setPeriodMinutes(Number(e.target.value))}
            min={1}
            max={1440}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] focus:border-[var(--lagoon)] focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name || !roomId || !slotIds}
            className="rounded-lg border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:bg-[rgba(79,184,178,0.24)] disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Tracker"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddNotificationForm({
  trackerId,
  onClose,
  onCreated,
}: {
  trackerId: number;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyProgression, setNotifyProgression] = useState(true);
  const [notifyUseful, setNotifyUseful] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    setSubmitting(true);
    setError("");
    try {
      await createNotificationConfig({
        data: {
          trackerId,
          webhookUrl,
          notifyProgression,
          notifyUseful,
        },
      });
      await onCreated();
      onClose();
    } catch {
      setError("Failed to create notification config.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
      <h4 className="mb-3 text-sm font-semibold text-[var(--sea-ink)]">
        Add Discord Webhook
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
            Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            required
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--sea-ink-soft)]">
            Notify for:
          </p>
          <div className="flex flex-wrap gap-3">
            <Checkbox
              label="Progression"
              checked={notifyProgression}
              onChange={setNotifyProgression}
            />
            <Checkbox
              label="Useful"
              checked={notifyUseful}
              onChange={setNotifyUseful}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !webhookUrl}
            className="rounded-lg border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-3 py-1.5 text-xs font-semibold text-[var(--lagoon-deep)] transition hover:bg-[rgba(79,184,178,0.24)] disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Webhook"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationConfigCard({
  config,
  onUpdated,
}: {
  config: {
    id: number;
    webhookUrl: string;
    enabled: boolean | null;
    notifyProgression: boolean | null;
    notifyUseful: boolean | null;
  };
  onUpdated: () => Promise<void>;
}) {
  const maskedUrl = config.webhookUrl.replace(
    /\/webhooks\/(\d+)\/(.+)/,
    "/webhooks/$1/****",
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-[var(--sea-ink)]">
          Discord: {maskedUrl}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {config.notifyProgression && (
            <Tag label="Progression" color="purple" />
          )}
          {config.notifyUseful && <Tag label="Useful" color="blue" />}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={config.enabled ? "Disable" : "Enable"}
          onClick={async () => {
            await updateNotificationConfig({
              data: { id: config.id, enabled: !config.enabled },
            });
            await onUpdated();
          }}
          className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          {config.enabled ? (
            <Power className="h-3.5 w-3.5" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 opacity-50" />
          )}
        </button>
        <button
          type="button"
          title="Delete"
          onClick={async () => {
            if (!confirm("Delete this notification config?")) return;
            await deleteNotificationConfig({ data: { id: config.id } });
            await onUpdated();
          }}
          className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-[var(--line)] accent-[var(--lagoon)]"
      />
      {label}
    </label>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colors[color] || colors.gray}`}
    >
      {label}
    </span>
  );
}
