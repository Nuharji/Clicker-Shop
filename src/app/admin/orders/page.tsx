import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isAdminSession } from "@/lib/auth";
import StatusSelect from "./status-select";

type OrderRow = {
  id: number;
  product_name: string;
  delivery_method: string;
  note: string;
  status: string;
  created_at: string;
  user_name: string;
  haus: number;
  etage: number;
  zimmer: number;
};

type SelectionRow = {
  order_id: number;
  part_name: string;
  variation_name: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdminSession())) {
    redirect("/login");
  }

  const params = await searchParams;

  const orders = await db.all<OrderRow>(
    `SELECT o.id, o.product_name, o.delivery_method, o.note, o.status, o.created_at,
            u.name AS user_name, u.haus, u.etage, u.zimmer
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
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

  // Für jedes Teil (z. B. "Farbe", "Kappe") die möglichen Varianten
  // sammeln, damit der Admin pro Teil eine Variante zum Filtern
  // auswählen kann ("welche Bestellungen brauchen Farbe: Schwarz?").
  const partOptions = new Map<string, Set<string>>();
  for (const s of selections) {
    const set = partOptions.get(s.part_name) ?? new Set<string>();
    set.add(s.variation_name);
    partOptions.set(s.part_name, set);
  }
  const partFilterGroups = Array.from(partOptions.entries())
    .map(([partName, variationSet]) => ({
      partName,
      variations: Array.from(variationSet).sort(),
    }))
    .sort((a, b) => a.partName.localeCompare(b.partName));

  // Aktive Filter aus der URL lesen: ein Query-Parameter pro Teilname.
  const activeFilters = new Map<string, string>();
  for (const group of partFilterGroups) {
    const raw = params[group.partName];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) activeFilters.set(group.partName, value);
  }
  const hasActiveFilters = activeFilters.size > 0;

  const filteredOrders =
    activeFilters.size === 0
      ? orders
      : orders.filter((o) => {
          const orderSelections = selections.filter((s) => s.order_id === o.id);
          for (const [partName, variationName] of activeFilters) {
            const match = orderSelections.some(
              (s) => s.part_name === partName && s.variation_name === variationName
            );
            if (!match) return false;
          }
          return true;
        });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Alle Bestellungen</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
        {orders.length} Bestellung{orders.length === 1 ? "" : "en"} insgesamt
        {hasActiveFilters &&
          ` · ${filteredOrders.length} davon passen zum Filter`}
        .
      </p>

      {partFilterGroups.length > 0 && (
        <form className="border border-stone-200 dark:border-stone-800 rounded-xl p-3 bg-white dark:bg-stone-900 flex flex-wrap items-end gap-3 mb-4">
          {partFilterGroups.map((group) => (
            <label key={group.partName} className="flex flex-col gap-1 text-xs">
              {group.partName}
              <select
                name={group.partName}
                defaultValue={activeFilters.get(group.partName) ?? ""}
                className="border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-md px-2 py-1.5 text-sm"
              >
                <option value="">Alle</option>
                {group.variations.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            type="submit"
            className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-full py-1.5 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 px-4"
          >
            Filtern
          </button>
          {hasActiveFilters && (
            <a
              href="/admin/orders"
              className="text-sm text-stone-500 dark:text-stone-400 hover:underline px-1 py-1.5"
            >
              Filter zurücksetzen
            </a>
          )}
        </form>
      )}

      {filteredOrders.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400">
          {orders.length === 0
            ? "Noch keine Bestellungen."
            : "Keine Bestellungen passen zu diesem Filter."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map((o) => {
            const orderSelections = selections.filter(
              (s) => s.order_id === o.id
            );
            return (
              <div
                key={o.id}
                className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">
                    {o.product_name}{" "}
                    <span
                      className={`text-xs font-normal px-1.5 py-0.5 rounded-full ${
                        o.delivery_method === "lieferung"
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                      }`}
                    >
                      {o.delivery_method === "lieferung" ? "Lieferung" : "Abholung"}
                    </span>
                  </p>
                  {orderSelections.length > 0 && (
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {orderSelections
                        .map((s) => `${s.part_name}: ${s.variation_name}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {o.user_name} · Zimmer {o.haus}.{o.etage}.{o.zimmer}
                  </p>
                  {o.note && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">„{o.note}“</p>
                  )}
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    {new Date(o.created_at + "Z").toLocaleString("de-DE")}
                  </p>
                </div>
                <StatusSelect orderId={o.id} currentStatus={o.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
