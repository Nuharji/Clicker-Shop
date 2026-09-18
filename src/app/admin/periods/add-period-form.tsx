"use client";

import { useActionState, useRef } from "react";
import { addPeriodAction, type FormState } from "../actions";

const initialState: FormState = {};

export default function AddPeriodForm() {
  const [state, formAction, pending] = useActionState(
    addPeriodAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3"
    >
      <h3 className="font-semibold">Neuen Abschnitt anlegen</h3>
      <input
        name="name"
        required
        placeholder="Name, z. B. Oktober-Bestellung"
        className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900"
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Start
          <input
            name="startDate"
            type="date"
            required
            className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ende
          <input
            name="endDate"
            type="date"
            required
            className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Credits pro Person
        <input
          name="credits"
          type="number"
          min={1}
          defaultValue={3}
          required
          className="border border-stone-300 dark:border-stone-700 rounded-md px-3 py-2 text-sm dark:bg-stone-900 w-32"
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
        className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-2 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 self-start px-5"
      >
        {pending ? "Wird angelegt…" : "Abschnitt anlegen"}
      </button>
    </form>
  );
}
