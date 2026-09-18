"use client";

import { useActionState, useRef, useState } from "react";
import { addVariationAction, type FormState } from "../actions";
import { MAX_MIX_COLORS } from "@/lib/colorMix";

export default function VariationForm({ partId }: { partId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mixColors, setMixColors] = useState<string[]>([]);
  const [stockMode, setStockMode] = useState<"on_demand" | "stock">("on_demand");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await addVariationAction(_prevState, formData);
      if (!result.error) {
        formRef.current?.reset();
        setMixColors([]);
        setStockMode("on_demand");
      }
      return result;
    },
    {}
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-1.5 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-2"
    >
      <input type="hidden" name="partId" value={partId} />
      <div className="flex items-center gap-2 flex-wrap">
        <input
          name="name"
          required
          placeholder="Variante, z. B. Mint"
          className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-1.5 text-sm w-28 dark:bg-stone-900"
        />
        <input
          name="hex"
          type="color"
          defaultValue="#888888"
          title="Primärfarbe"
          className="w-9 h-9 border border-stone-300 dark:border-stone-700 rounded-md p-0.5"
        />
        {mixColors.map((c, i) => (
          <span key={i} className="relative">
            <input
              name="mixColor"
              type="color"
              value={c}
              title="Mix-Farbe"
              onChange={(e) => {
                const next = [...mixColors];
                next[i] = e.target.value;
                setMixColors(next);
              }}
              className="w-9 h-9 border border-stone-300 dark:border-stone-700 rounded-md p-0.5"
            />
            <button
              type="button"
              onClick={() => setMixColors(mixColors.filter((_, j) => j !== i))}
              title="Mix-Farbe entfernen"
              className="absolute -top-1.5 -right-1.5 bg-stone-700 text-white rounded-full w-3.5 h-3.5 text-[9px] leading-none flex items-center justify-center"
            >
              ✕
            </button>
          </span>
        ))}
        {mixColors.length < MAX_MIX_COLORS - 1 && (
          <button
            type="button"
            onClick={() => setMixColors([...mixColors, "#ffffff"])}
            title="Mix-Farbe hinzufügen"
            className="w-9 h-9 border border-dashed border-stone-300 dark:border-stone-700 rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:border-stone-500 text-sm"
          >
            +
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-1.5 rounded-full disabled:opacity-50"
        >
          + Variante
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        Sound (optional):
        <input
          name="sound"
          type="file"
          accept="audio/*"
          className="text-xs"
        />
      </label>
      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        <select
          name="stockMode"
          value={stockMode}
          onChange={(e) => setStockMode(e.target.value as "on_demand" | "stock")}
          className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-1.5 py-1 text-xs"
        >
          <option value="on_demand">On-Demand (immer bestellbar)</option>
          <option value="stock">Lagerbestand</option>
        </select>
        {stockMode === "stock" && (
          <input
            name="stockCount"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="Stück"
            className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-2 py-1 text-xs w-20"
          />
        )}
      </div>
      {state.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
