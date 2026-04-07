import { authClient } from "#/lib/auth-client";
import { Link } from "@tanstack/react-router";
import DiscordIcon from "./DiscordIcon";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="nav-link"
          activeProps={{ className: "nav-link is-active" }}
        >
          Dashboard
        </Link>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            void authClient.signOut();
          }}
          className="h-8 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void authClient.signIn.social({ provider: "discord" });
      }}
      className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#5865F2]/40 bg-[#5865F2]/10 px-3 text-xs font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/20 dark:border-[#5865F2]/30 dark:text-[#7983F5]"
    >
      <DiscordIcon />
      Sign in with Discord
    </button>
  );
}
