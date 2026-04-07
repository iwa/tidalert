import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 text-secondary py-6 flex flex-row gap-1 items-center justify-center">
      <p className="m-0 text-sm">Made by iwa with</p>
      <Heart className="h-4 w-4" />
    </footer>
  );
}
