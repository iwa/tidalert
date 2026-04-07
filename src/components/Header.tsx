import { Link } from "@tanstack/react-router";
import BetterAuthHeader from "./BetterAuthHeader.tsx";
import ThemeToggle from "./ThemeToggle";
import { Waves } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-secondary p-4">
      <nav className="flex flex-wrap items-center justify-between">
        <Link to="/" className="flex flex-row gap-2 items-center">
          <Waves />
          <h2 className="m-0 text-xl font-bold tracking-light">Tidalert</h2>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <BetterAuthHeader />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
