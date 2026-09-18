"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// Auf dem Server wissen wir nicht, welches Theme aktiv ist (das
// entscheidet erst das Inline-Script im Browser) – Startwert ist daher
// egal, das erste Icon wird ohnehin sofort durch den echten Wert ersetzt.
function getServerSnapshot() {
  return false;
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      aria-label="Theme umschalten"
      className="text-sm px-2 py-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
      suppressHydrationWarning
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
