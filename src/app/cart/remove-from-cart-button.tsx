"use client";

import { removeFromCartAction } from "./actions";

export default function RemoveFromCartButton({ id }: { id: number }) {
  return (
    <form action={removeFromCartAction}>
      <input type="hidden" name="id" value={id} />
      <button
        title="Aus Warenkorb entfernen"
        className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-1 shrink-0"
      >
        🗑
      </button>
    </form>
  );
}
