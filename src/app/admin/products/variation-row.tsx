"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateVariationAction,
  moveVariationAction,
  toggleVariationActiveAction,
  deleteVariationAction,
  type FormState,
} from "../actions";
import {
  MAX_MIX_COLORS,
  parseMixColors,
  swatchBackground,
} from "@/lib/colorMix";
import { isSoldOut } from "@/lib/stock";

type Variation = {
  id: number;
  name: string;
  hex: string;
  mix_colors: string;
  sound_data: string | null;
  stock_mode: string;
  stock_count: number;
  active: number;
};

export default function VariationRow({
  variation,
  isFirst,
  isLast,
}: {
  variation: Variation;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(variation.name);
  const [hex, setHex] = useState(variation.hex);
  const [mixColors, setMixColors] = useState<string[]>(
    parseMixColors(variation.mix_colors)
  );
  const [removeSound, setRemoveSound] = useState(false);
  const [stockMode, setStockMode] = useState<"on_demand" | "stock">(
    variation.stock_mode === "stock" ? "stock" : "on_demand"
  );
  const [pending, startTransition] = useTransition();
  const [state, formAction, savePending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await updateVariationAction(_prevState, formData);
      if (!result.error) {
        setEditing(false);
        setRemoveSound(false);
      }
      return result;
    },
    {}
  );

  function move(direction: "up" | "down") {
    const formData = new FormData();
    formData.set("id", String(variation.id));
    formData.set("direction", direction);
    startTransition(() => {
      moveVariationAction(formData);
    });
  }

  if (editing) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-1.5 border border-stone-300 dark:border-stone-700 rounded-lg pl-2 pr-2 py-2 bg-white dark:bg-stone-900"
      >
        <input type="hidden" name="id" value={variation.id} />
        {removeSound && <input type="hidden" name="removeSound" value="1" />}
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            name="hex"
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            title="Primärfarbe"
            className="w-7 h-7 border-0 p-0 bg-transparent"
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
                className="w-7 h-7 border-0 p-0 bg-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setMixColors(mixColors.filter((_, j) => j !== i))
                }
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
              className="w-7 h-7 border border-dashed border-stone-300 dark:border-stone-700 rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm shrink-0"
            >
              +
            </button>
          )}
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm w-20 border-b border-stone-300 dark:border-stone-700 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={savePending}
            title="Speichern"
            className="text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 px-1"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setName(variation.name);
              setHex(variation.hex);
              setMixColors(parseMixColors(variation.mix_colors));
              setRemoveSound(false);
              setStockMode(variation.stock_mode === "stock" ? "stock" : "on_demand");
              setEditing(false);
            }}
            title="Abbrechen"
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-1"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <select
            name="stockMode"
            value={stockMode}
            onChange={(e) => setStockMode(e.target.value as "on_demand" | "stock")}
            className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-1.5 py-1 text-xs"
          >
            <option value="on_demand">On-Demand</option>
            <option value="stock">Lagerbestand</option>
          </select>
          {stockMode === "stock" && (
            <input
              name="stockCount"
              type="number"
              min={0}
              defaultValue={variation.stock_count}
              className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-2 py-1 text-xs w-20"
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          {variation.sound_data && !removeSound ? (
            <>
              <audio controls src={variation.sound_data} className="h-6" />
              <button
                type="button"
                onClick={() => setRemoveSound(true)}
                className="text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400"
              >
                Sound entfernen
              </button>
            </>
          ) : (
            <label className="flex items-center gap-1.5">
              Sound{removeSound ? " (wird entfernt)" : ""}:
              <input name="sound" type="file" accept="audio/*" className="text-xs" />
            </label>
          )}
        </div>
        {state.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
      </form>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 text-sm border rounded-full pl-2 pr-1 py-1 bg-white dark:bg-stone-900 ${
        variation.active ? "border-stone-200 dark:border-stone-800" : "border-stone-100 dark:border-stone-800 opacity-50"
      }`}
    >
      <span
        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
        style={{ background: swatchBackground(variation.hex, variation.mix_colors) }}
      />
      <button
        onClick={() => setEditing(true)}
        className="hover:underline"
        title="Bearbeiten"
      >
        {variation.name}
      </button>
      {variation.sound_data && (
        <span title="Hat einen Sound" className="text-xs">
          🔊
        </span>
      )}
      {variation.stock_mode === "stock" && (
        <span
          title="Lagerbestand"
          className={`text-[11px] px-1.5 py-0.5 rounded-full ${
            isSoldOut(variation)
              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
              : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
          }`}
        >
          {isSoldOut(variation) ? "ausverkauft" : `${variation.stock_count}×`}
        </span>
      )}
      <button
        onClick={() => move("up")}
        disabled={isFirst || pending}
        title="Nach oben"
        className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-0.5 disabled:opacity-20"
      >
        ↑
      </button>
      <button
        onClick={() => move("down")}
        disabled={isLast || pending}
        title="Nach unten"
        className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-0.5 disabled:opacity-20"
      >
        ↓
      </button>
      <form action={toggleVariationActiveAction}>
        <input type="hidden" name="id" value={variation.id} />
        <button
          title={variation.active ? "Ausblenden" : "Einblenden"}
          className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-1"
        >
          {variation.active ? "👁" : "🚫"}
        </button>
      </form>
      <form action={deleteVariationAction}>
        <input type="hidden" name="id" value={variation.id} />
        <button
          title="Löschen"
          className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-1"
        >
          🗑
        </button>
      </form>
    </div>
  );
}
