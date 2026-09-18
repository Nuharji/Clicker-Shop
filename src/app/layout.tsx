import type { Metadata } from "next";
import "./globals.css";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { getCreditsInfo } from "@/lib/periods";
import Nav from "./nav";
import ThemeScript from "./theme-script";

export const metadata: Metadata = {
  title: "Dumpling Clicker",
  description: "3D-gedruckte Fidgets für unser Internat – kostenlos bestellen.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.type === "user" ? await getCurrentUser() : null;
  const cartCount = user ? await getCartCount(user.id) : 0;
  const credits = user ? await getCreditsInfo(user.id) : null;

  return (
    <html lang="de" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        <Nav session={session} cartCount={cartCount} credits={credits} />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="text-center text-xs text-stone-400 dark:text-stone-500 py-6">
          Dumpling Clicker · intern & kostenlos
        </footer>
      </body>
    </html>
  );
}
