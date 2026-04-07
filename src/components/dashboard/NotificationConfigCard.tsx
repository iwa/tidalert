import {
  deleteNotificationConfig,
  updateNotificationConfig,
} from "#/lib/server/trackers";
import { Power, PowerOff, Trash2 } from "lucide-react";

export default function NotificationConfigCard({
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
