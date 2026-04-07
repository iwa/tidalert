import { Button } from "#/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Gamepad2, Globe, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  return (
    <main className="px-24 pb-8 pt-14">
      <section className="relative overflow-hidden">
        <p className="mb-3">Archipelago Item Tracker</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
          Never miss a received item.
        </h1>
        <p className="mb-8 max-w-2xl text-base sm:text-lg">
          Track your Archipelago async games and get notifications whenever
          someone sends you a progression or useful item.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <a
            href="https://archipelago.gg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="link">What is Archipelago?</Button>
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
        ).map(([Icon, title, desc]) => (
          <Card>
            <CardHeader>
              <Icon className="mb-3 h-6 w-6" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">How It Works</p>
        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm">
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
