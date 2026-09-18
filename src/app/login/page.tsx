"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import AddressFields from "../address-fields";
import { loginAction, adminLoginAction, type FormState } from "./actions";

const initialState: FormState = {};

export default function LoginPage() {
  const [tab, setTab] = useState<"user" | "admin">("user");
  const [userState, userFormAction, userPending] = useActionState(
    loginAction,
    initialState
  );
  const [adminState, adminFormAction, adminPending] = useActionState(
    adminLoginAction,
    initialState
  );

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      <div className="flex gap-2 mb-6 text-sm">
        <button
          type="button"
          onClick={() => setTab("user")}
          className={`px-3 py-1.5 rounded-full border ${
            tab === "user"
              ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
              : "border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-400"
          }`}
        >
          Bewohner:in
        </button>
        <button
          type="button"
          onClick={() => setTab("admin")}
          className={`px-3 py-1.5 rounded-full border ${
            tab === "admin"
              ? "bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
              : "border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-400"
          }`}
        >
          Admin
        </button>
      </div>

      {tab === "user" ? (
        <form action={userFormAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              name="name"
              required
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
              className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
            />
          </label>

          {userState.error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {userState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={userPending}
            className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2.5 font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50"
          >
            {userPending ? "Wird geprüft…" : "Einloggen"}
          </button>

          <p className="text-sm text-stone-500 dark:text-stone-400">
            Noch kein Konto?{" "}
            <Link href="/register" className="underline">
              Jetzt registrieren
            </Link>
          </p>
        </form>
      ) : (
        <form action={adminFormAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Benutzername
            <input
              name="username"
              required
              className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Passwort
            <input
              name="password"
              type="password"
              required
              className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 dark:bg-stone-900"
            />
          </label>

          {adminState.error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {adminState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={adminPending}
            className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2.5 font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50"
          >
            {adminPending ? "Wird geprüft…" : "Als Admin einloggen"}
          </button>
        </form>
      )}
    </div>
  );
}
