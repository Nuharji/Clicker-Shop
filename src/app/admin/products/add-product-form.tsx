"use client";

import { useActionState, useRef, useState } from "react";
import { addProductAction, type FormState } from "../actions";

const initialState: FormState = {};

type Variation = { key: string; name: string; hex: string };
type Part = { key: string; name: string; variations: Variation[] };

function makeKey() {
  return Math.random().toString(36).slice(2);
}

export default function AddProductForm() {
  const [state, formAction, pending] = useActionState(
    addProductAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [parts, setParts] = useState<Part[]>([]);

  function addPart() {
    setParts((prev) => [...prev, { key: makeKey(), name: "", variations: [] }]);
  }

  function removePart(key: string) {
    setParts((prev) => prev.filter((p) => p.key !== key));
  }

  function updatePartName(key: string, name: string) {
    setParts((prev) => prev.map((p) => (p.key === key ? { ...p, name } : p)));
  }

  function addVariation(partKey: string) {
    setParts((prev) =>
      prev.map((p) =>
        p.key === partKey
          ? {
              ...p,
              variations: [
                ...p.variations,
                { key: makeKey(), name: "", hex: "#888888" },
              ],
            }
          : p
      )
    );
  }

  function updateVariation(
    partKey: string,
    variationKey: string,
    field: "name" | "hex",
    value: string
  ) {
    setParts((prev) =>
      prev.map((p) =>
        p.key !== partKey
          ? p
          : {
              ...p,
              variations: p.variations.map((v) =>
                v.key === variationKey ? { ...v, [field]: value } : v
              ),
            }
      )
    );
  }

  function removeVariation(partKey: string, variationKey: string) {
    setParts((prev) =>
      prev.map((p) =>
        p.key !== partKey
          ? p
          : { ...p, variations: p.variations.filter((v) => v.key !== variationKey) }
      )
    );
  }

  const partsJson = JSON.stringify(
    parts.map((p) => ({
      name: p.name,
      variations: p.variations.map((v) => ({ name: v.name, hex: v.hex })),
    }))
  );

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await formAction(formData);
        formRef.current?.reset();
        setParts([]);
      }}
      className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3"
    >
      <h3 className="font-semibold">Neues Produkt anlegen</h3>
      <input
        name="name"
        required
        placeholder="Name, z. B. Dumpling Clicker Classic"
        className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900"
      />
      <textarea
        name="description"
        placeholder="Kurze Beschreibung (optional)"
        rows={2}
        className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900"
      />
      <label className="text-sm text-stone-600 dark:text-stone-400 flex flex-col gap-1">
        Bild (optional, max. 2 MB)
        <input name="image" type="file" accept="image/*" className="text-sm" />
      </label>

      <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Teile &amp; Varianten (optional)
          </p>
          <button
            type="button"
            onClick={addPart}
            className="text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-1.5 rounded-full"
          >
            + Teil hinzufügen
          </button>
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-500 -mt-2">
          Ein Teil ist z. B. „Gehäuse“ oder „Kappe“. Für jeden Teil kannst du
          mehrere Varianten (z. B. Farben) angeben – beim Bestellen wählt man
          dann für jeden Teil eine Variante aus.
        </p>

        {parts.map((part, pIndex) => (
          <div
            key={part.key}
            className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 flex flex-col gap-2 bg-stone-50 dark:bg-stone-950"
          >
            <div className="flex items-center gap-2">
              <input
                value={part.name}
                onChange={(e) => updatePartName(part.key, e.target.value)}
                placeholder={`Teil ${pIndex + 1}, z. B. Gehäuse`}
                className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-1.5 text-sm flex-1 dark:bg-stone-900"
              />
              <button
                type="button"
                onClick={() => removePart(part.key)}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-1"
                title="Teil entfernen"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pl-1">
              {part.variations.map((v) => (
                <div
                  key={v.key}
                  className="flex items-center gap-1.5 border border-stone-200 dark:border-stone-800 rounded-full pl-2 pr-1 py-1 bg-white dark:bg-stone-900"
                >
                  <input
                    type="color"
                    value={v.hex}
                    onChange={(e) =>
                      updateVariation(part.key, v.key, "hex", e.target.value)
                    }
                    className="w-5 h-5 border-0 p-0 bg-transparent"
                  />
                  <input
                    value={v.name}
                    onChange={(e) =>
                      updateVariation(part.key, v.key, "name", e.target.value)
                    }
                    placeholder="Variante, z. B. Rot"
                    className="text-sm w-24 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariation(part.key, v.key)}
                    className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-1"
                    title="Variante entfernen"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addVariation(part.key)}
                className="text-xs bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 px-3 py-1.5 rounded-full self-center"
              >
                + Variante
              </button>
            </div>
          </div>
        ))}
      </div>

      <input type="hidden" name="partsJson" value={partsJson} />

      {state.error && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 self-start px-5"
      >
        {pending ? "Wird angelegt…" : "Produkt anlegen"}
      </button>
    </form>
  );
}
