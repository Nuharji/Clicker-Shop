"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { addToCartAction, type FormState } from "./actions";
import { swatchBackground } from "@/lib/colorMix";
import { isSoldOut } from "@/lib/stock";

type Variation = {
  id: number;
  name: string;
  hex: string;
  mix_colors: string;
  sound_data: string | null;
  stock_mode: string;
  stock_count: number;
};
type Part = { id: number; name: string; variations: Variation[] };

const initialState: FormState = {};

export default function OrderForm({
  productId,
  parts,
  loggedIn,
}: {
  productId: number;
  parts: Part[];
  loggedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    addToCartAction,
    initialState
  );
  const [selected, setSelected] = useState<Record<number, number | "">>(
    Object.fromEntries(
      parts.map((p) => {
        const firstAvailable = p.variations.find((v) => !isSoldOut(v));
        return [p.id, firstAvailable?.id ?? ""];
      })
    )
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  function playSound(src: string) {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play().catch(() => {});
    }
  }

  // Ist für einen Teil KEINE Variante mehr verfügbar (alle ausverkauft),
  // kann das ganze Produkt aktuell nicht bestellt werden.
  const unavailablePart = parts.find(
    (p) => p.variations.length > 0 && p.variations.every((v) => isSoldOut(v))
  );

  if (unavailablePart) {
    return (
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-stone-50 dark:bg-stone-950 text-sm text-stone-600 dark:text-stone-400">
        Dieses Produkt ist gerade ausverkauft (&bdquo;{unavailablePart.name}
        &ldquo; hat keine verfügbaren Varianten mehr). Schau später nochmal
        vorbei.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <audio ref={audioRef} className="hidden" />
      <input type="hidden" name="productId" value={productId} />

      {parts.map((part) => (
        <div key={part.id} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{part.name}</p>
          <div className="flex flex-wrap gap-2">
            {part.variations.map((v) => {
              const soldOut = isSoldOut(v);
              return (
                <label
                  key={v.id}
                  className={`flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm ${
                    soldOut
                      ? "cursor-not-allowed opacity-40 line-through"
                      : loggedIn
                      ? "cursor-pointer"
                      : "cursor-default opacity-90"
                  } ${
                    selected[part.id] === v.id
                      ? "border-stone-900"
                      : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <input
                    type="radio"
                    name={`part_${part.id}`}
                    value={v.id}
                    checked={selected[part.id] === v.id}
                    disabled={!loggedIn || soldOut}
                    onChange={() =>
                      setSelected((prev) => ({ ...prev, [part.id]: v.id }))
                    }
                    className="sr-only"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                    style={{ background: swatchBackground(v.hex, v.mix_colors) }}
                  />
                  {v.name}
                  {soldOut && " (ausverkauft)"}
                  {!soldOut && v.sound_data && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        playSound(v.sound_data!);
                      }}
                      title="Sound abspielen"
                      className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                    >
                      🔊
                    </button>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {loggedIn ? (
        <>
          {state.error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md px-3 py-2">
              In den Warenkorb gelegt!{" "}
              <Link href="/cart" className="underline">
                Zum Warenkorb
              </Link>
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 self-start px-5"
          >
            {pending ? "Wird hinzugefügt…" : "In den Warenkorb legen"}
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="inline-block text-sm bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 self-start"
        >
          Zum Bestellen einloggen
        </Link>
      )}
    </form>
  );
}
