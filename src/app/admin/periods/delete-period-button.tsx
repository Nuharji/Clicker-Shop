"use client";

import { deletePeriodAction } from "../actions";

export default function DeletePeriodButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  return (
    <form
      action={deletePeriodAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Abschnitt "${name}" wirklich löschen? Bestellungen bleiben erhalten, verlieren aber den Bezug zu diesem Abschnitt.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-xs bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 px-3 py-1.5 rounded-full whitespace-nowrap">
        Löschen
      </button>
    </form>
  );
}
