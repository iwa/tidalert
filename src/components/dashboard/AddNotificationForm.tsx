import { createNotificationConfig } from "#/lib/server/trackers";
import { useState } from "react";

export default function AddNotificationForm({
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

  const handleSubmit = async (e: React.SubmitEvent) => {
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
