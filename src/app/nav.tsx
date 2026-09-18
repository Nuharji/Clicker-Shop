import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import type { CreditsInfo } from "@/lib/periods";
import LogoutButton from "./logout-button";
import ThemeToggle from "./theme-toggle";

export default function Nav({
  session,
  cartCount = 0,
  credits = null,
}: {
  session: SessionPayload | null;
  cartCount?: number;
  credits?: CreditsInfo | null;
}) {
  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🥟 Dumpling Clicker
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Shop
          </Link>
          {session?.type === "user" && (
            <>
              <Link href="/orders" className="hover:underline">
                Meine Bestellungen
              </Link>
              <Link href="/cart" className="hover:underline">
                Warenkorb{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
              <span
                title="Dein Credit-Guthaben im aktuellen Bestellabschnitt"
                className="text-xs text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 rounded-full px-2 py-1"
              >
                💳 {credits ? `${credits.remaining}/${credits.total} Credits` : "kein Abschnitt"}
              </span>
            </>
          )}
          {session?.type === "admin" && (
            <>
              <Link href="/admin/products" className="hover:underline">
                Produkte
              </Link>
              <Link href="/admin/orders" className="hover:underline">
                Alle Bestellungen
              </Link>
              <Link href="/admin/periods" className="hover:underline">
                Abschnitte
              </Link>
              <Link href="/admin/stats" className="hover:underline">
                Statistik
              </Link>
            </>
          )}
          <ThemeToggle />
          {session ? (
            <span className="flex items-center gap-2">
              <span className="text-stone-500 dark:text-stone-400">Hi, {session.name}</span>
              <LogoutButton />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-3 py-1.5 rounded-full hover:bg-stone-700 dark:hover:bg-stone-300"
              >
                Registrieren
              </Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
