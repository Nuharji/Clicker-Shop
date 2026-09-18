"use client";

import { useActionState } from "react";
import { checkoutCartAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function CheckoutForm({
  itemCount,
  creditsRemaining,
  hasActivePeriod,
}: {
  itemCount: number;
  creditsRemaining: number;
  hasActivePeriod: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    checkoutCartAction,
    initialState
  );

  const notEnoughCredits = hasActivePeriod && itemCount > creditsRemaining;
  const canCheckout = hasActivePeriod && !notEnoughCredits;

  return (
    <form
      action={formAction}
      className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3"
    >
      <p className="text-sm font-medium">Abholung oder Lieferung?</p>
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-2 border border-stone-200 dark:border-stone-800 rounded-full px-3 py-1.5 cursor-pointer has-[:checked]:border-stone-900 dark:has-[:checked]:border-stone-100">
          <input
            type="radio"
            name="deliveryMethod"
            value="abholung"
            defaultChecked
            className="accent-stone-900 dark:accent-stone-100"
          />
          Abholung
        </label>
        <label className="flex items-center gap-2 border border-stone-200 dark:border-stone-800 rounded-full px-3 py-1.5 cursor-pointer has-[:checked]:border-stone-900 dark:has-[:checked]:border-stone-100">
          <input
            type="radio"
            name="deliveryMethod"
            value="lieferung"
            className="accent-stone-900 dark:accent-stone-100"
          />
          Lieferung ins Zimmer
        </label>
      </div>

      <input
        name="note"
        placeholder="Anmerkung (optional)"
        maxLength={300}
        className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-3 py-2 text-sm"
      />

      {!hasActivePeriod && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Kein Bestellzeitraum aktiv – Abschicken ist gerade nicht möglich.
        </p>
      )}
      {notEnoughCredits && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          Du hast nur noch {creditsRemaining} Credit(s), aber {itemCount}{" "}
          Artikel im Warenkorb. Entferne etwas, um abzuschicken.
        </p>
      )}
      {state.error && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !canCheckout}
        className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 self-start px-5"
      >
        {pending ? "Wird bestellt…" : `${itemCount} Artikel kostenlos bestellen`}
      </button>
    </form>
  );
}
