import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { statusLabel, statusColor } from "@/lib/status";

type OrderRow = {
  id: number;
  product_name: string;
  delivery_method: string;
  note: string;
  status: string;
  created_at: string;
};

type SelectionRow = {
  order_id: number;
  part_name: string;
  variation_name: string;
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await db.all<OrderRow>(
    `SELECT id, product_name, delivery_method, note, status, created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );

  const orderIds = orders.map((o) => o.id);
  const selections =
    orderIds.length === 0
      ? []
      : await db.all<SelectionRow>(
          `SELECT order_id, part_name, variation_name FROM order_selections
           WHERE order_id IN (${orderIds.map(() => "?").join(",")})
           ORDER BY sort_order ASC`,
          orderIds
        );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Meine Bestellungen</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
        Eingeloggt als {user.name} · Zimmer {user.haus}.{user.etage}.
        {user.zimmer}
      </p>

      {orders.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          Du hast noch nichts bestellt. Schau im Shop vorbei!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const orderSelections = selections.filter(
              (s) => s.order_id === o.id
            );
            return (
              <li
                key={o.id}
                className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">
                    {o.product_name}{" "}
                    <span className="text-xs font-normal text-stone-400 dark:text-stone-500">
                      ({o.delivery_method === "lieferung" ? "Lieferung" : "Abholung"})
                    </span>
                  </p>
                  {orderSelections.length > 0 && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                      {orderSelections
                        .map((s) => `${s.part_name}: ${s.variation_name}`)
                        .join(" · ")}
                    </p>
                  )}
                  {o.note && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">„{o.note}“</p>
                  )}
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Bestellt am{" "}
                    {new Date(o.created_at + "Z").toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-full text-white whitespace-nowrap"
                  style={{ backgroundColor: statusColor(o.status) }}
                >
                  {statusLabel(o.status)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
