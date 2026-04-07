import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
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
import { validateRoom } from "#/lib/server/ap-api";
import { getAuthSession } from "#/lib/server/authSession";
import AddTrackerForm from "#/components/dashboard/AddTrackerForm";
import AddNotificationForm from "#/components/dashboard/AddNotificationForm";
import NotificationConfigCard from "#/components/dashboard/NotificationConfigCard";

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
                      Room: {tracker.roomId} | Slots: {tracker.slotIds}
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
