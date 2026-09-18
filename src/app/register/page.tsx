"use client";

import { useActionState } from "react";
import Link from "next/link";
import AddressFields from "../address-fields";
import { registerAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-1">Konto erstellen</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
        Nur für Bewohner:innen unseres Internats.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            required
            minLength={2}
            placeholder="Vorname Nachname"
            className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
          />
        </label>

        <AddressFields />

        <label className="flex flex-col gap-1 text-sm">
          Passwort
          <input
            name="password"
            type="password"
            required
            minLength={4}
            className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Passwort wiederholen
          <input
            name="password2"
            type="password"
            required
            minLength={4}
            className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
          />
        </label>

        {state.error && (
          <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2.5 font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50"
        >
          {pending ? "Wird erstellt…" : "Konto erstellen"}
        </button>
      </form>

      <p className="text-sm text-stone-500 dark:text-stone-400 mt-4">
        Schon registriert?{" "}
        <Link href="/login" className="underline">
          Zum Login
        </Link>
      </p>
    </div>
  );
}
