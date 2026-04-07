import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Gamepad2, Globe, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Archipelago Item Tracker</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Never miss a received item.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Track your Archipelago Multiworld randomizer games and get Discord
          notifications whenever someone sends you a progression or useful item.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Go to Dashboard
          </Link>
          <a
            href="https://archipelago.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            What is Archipelago?
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            [
              Gamepad2,
              "Multi-Game Tracking",
              "Track items across any Archipelago-supported game in your multiworld.",
            ],
            [
              Bell,
              "Your Own Notification Providers",
              "Get notified when you receive progression or useful items via Discord webhooks, Telegram, and many more.",
            ],
            [
              Globe,
              "Multiple Trackers",
              "Monitor several multiworld sessions at once from a single dashboard.",
            ],
            [
              Zap,
              "Automatic Polling",
              "Background polling checks for new items periodically so you never miss anything.",
            ],
          ] as const
        ).map(([Icon, title, desc], index) => (
          <Card>
            <CardHeader>
              <Icon className="mb-3 h-6 w-6 text-[var(--lagoon-deep)]" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">How It Works</p>
        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>Sign in with Discord.</li>
          <li>
            Add your Archipelago room ID and the slot IDs you want to track.
          </li>
          <li>Configure a Discord webhook to receive notifications.</li>
          <li>
            The tracker polls the Archipelago API and sends you a notification
            for each new item received.
          </li>
        </ol>
      </section>
    </main>
  );
}
