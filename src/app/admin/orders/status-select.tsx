"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "../actions";
import { ORDER_STATUSES } from "@/lib/status";

export default function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("id", String(orderId));
        formData.set("status", e.target.value);
        startTransition(() => {
          updateOrderStatusAction(formData);
        });
      }}
      className="border border-stone-300 dark:border-stone-700 rounded-md px-2 py-1.5 text-sm disabled:opacity-50 dark:bg-stone-900"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
