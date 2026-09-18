"use client";

import { useRef } from "react";
import { addPartAction } from "../actions";

export default function PartForm({ productId }: { productId: number }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await addPartAction(formData);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="productId" value={productId} />
      <input
        name="name"
        required
        placeholder="Neuer Teil, z. B. Kappe"
        className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-1.5 text-sm w-40 dark:bg-stone-900"
      />
      <button
        type="submit"
        className="text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-1.5 rounded-full"
      >
        + Teil
      </button>
    </form>
  );
}
