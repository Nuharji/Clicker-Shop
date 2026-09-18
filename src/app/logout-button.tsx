"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:underline"
      type="button"
    >
      Logout
    </button>
  );
}
