"use client";

import { useState } from "react";
import { HAUS_LIST, ZIMMER_LIST, etagenForHaus } from "@/lib/address";

export default function AddressFields({
  defaultHaus,
  defaultEtage,
  defaultZimmer,
}: {
  defaultHaus?: number;
  defaultEtage?: number;
  defaultZimmer?: number;
}) {
  const [haus, setHaus] = useState<number | "">(defaultHaus ?? "");
  const etagen = haus === "" ? [] : etagenForHaus(Number(haus));

  return (
    <div className="grid grid-cols-3 gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Haus
        <select
          name="haus"
          required
          value={haus}
          onChange={(e) =>
            setHaus(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-2 dark:bg-stone-900"
        >
          <option value="" disabled>
            –
          </option>
          {HAUS_LIST.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Etage
        <select
          name="etage"
          required
          defaultValue={defaultEtage ?? ""}
          disabled={haus === ""}
          className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-2 dark:bg-stone-900 disabled:bg-stone-100 dark:disabled:bg-stone-800"
        >
          <option value="" disabled>
            –
          </option>
          {etagen.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Zimmer
        <select
          name="zimmer"
          required
          defaultValue={defaultZimmer ?? ""}
          className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-2 dark:bg-stone-900"
        >
          <option value="" disabled>
            –
          </option>
          {ZIMMER_LIST.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
