import { validateRoom } from "#/lib/server/ap-api";
import { createTracker } from "#/lib/server/trackers";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AddTrackerForm({
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
