import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isAdminSession } from "@/lib/auth";
import { statusColor, ORDER_STATUSES } from "@/lib/status";

const SEQUENTIAL_HUE = "#2a78d6";

function HBar({
  label,
  value,
  max,
  color,
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  valueLabel?: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-stone-600 dark:text-stone-400 w-36 shrink-0 truncate" title={label}>
        {label}
      </p>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-sm h-6 relative">
          <div
            className="h-6 rounded-r-[4px]"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="text-xs font-medium text-stone-700 dark:text-stone-300 w-8 text-right shrink-0">
          {valueLabel ?? value}
        </span>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-1">
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
      <p className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
        {value}
      </p>
    </div>
  );
}

export default async function StatsPage() {
  if (!(await isAdminSession())) {
    redirect("/login");
  }

  const totalOrders =
    (await db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM orders`))?.c ?? 0;
  const totalUsers =
    (await db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM users`))?.c ?? 0;
  const occupiedRooms =
    (await db.get<{ c: number }>(
      `SELECT COUNT(DISTINCT haus || '.' || etage || '.' || zimmer) AS c FROM users`
    ))?.c ?? 0;
  const totalProducts =
    (await db.get<{ c: number }>(
      `SELECT COUNT(*) AS c FROM products WHERE active = 1`
    ))?.c ?? 0;

  const byStatus = await db.all<{ status: string; c: number }>(
    `SELECT status, COUNT(*) AS c FROM orders GROUP BY status`
  );
  const statusCounts = ORDER_STATUSES.map((s) => ({
    ...s,
    count: byStatus.find((r) => r.status === s.value)?.c ?? 0,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  const byProduct = await db.all<{ product_name: string; c: number }>(
    `SELECT product_name, COUNT(*) AS c FROM orders GROUP BY product_name ORDER BY c DESC LIMIT 8`
  );
  const maxProduct = Math.max(1, ...byProduct.map((p) => p.c));

  const byVariationRaw = await db.all<{
    part_name: string;
    variation_name: string;
    c: number;
  }>(
    `SELECT part_name, variation_name, COUNT(*) AS c FROM order_selections
     GROUP BY part_name, variation_name ORDER BY part_name ASC, c DESC`
  );

  // Nach Teil ("Kategorie") gruppieren, damit z. B. "Farbe" und "Kappe"
  // getrennte Rankings bekommen statt einer vermischten Gesamtliste.
  const variationsByPart = new Map<string, { variation_name: string; c: number }[]>();
  for (const row of byVariationRaw) {
    const list = variationsByPart.get(row.part_name) ?? [];
    list.push({ variation_name: row.variation_name, c: row.c });
    variationsByPart.set(row.part_name, list);
  }
  const variationPartGroups = Array.from(variationsByPart.entries()).map(
    ([partName, variations]) => ({
      partName,
      variations: variations.slice(0, 6),
      max: Math.max(1, ...variations.map((v) => v.c)),
    })
  );

  const byPeriod = await db.all<{ name: string; c: number }>(
    `SELECT COALESCE(op.name, 'Ohne Abschnitt') AS name, COUNT(*) AS c
     FROM orders o
     LEFT JOIN order_periods op ON op.id = o.period_id
     GROUP BY o.period_id
     ORDER BY c DESC
     LIMIT 8`
  );
  const maxPeriod = Math.max(1, ...byPeriod.map((p) => p.c));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Statistik</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Überblick über Bestellungen, Nutzer:innen und beliebte Varianten.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Bestellungen insgesamt" value={totalOrders} />
        <StatTile label="Registrierte Nutzer:innen" value={totalUsers} />
        <StatTile label="Belegte Zimmer" value={occupiedRooms} />
        <StatTile label="Sichtbare Produkte" value={totalProducts} />
      </div>

      <div className="border border-stone-200 dark:border-stone-800 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3">
        <p className="text-sm font-semibold">Bestellungen nach Status</p>
        <div className="flex flex-col gap-2">
          {statusCounts.map((s) => (
            <HBar
              key={s.value}
              label={s.label}
              value={s.count}
              max={maxStatus}
              color={statusColor(s.value)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-stone-200 dark:border-stone-800 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3">
          <p className="text-sm font-semibold">Beliebteste Produkte</p>
          {byProduct.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-stone-500">Noch keine Bestellungen.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {byProduct.map((p) => (
                <HBar
                  key={p.product_name}
                  label={p.product_name}
                  value={p.c}
                  max={maxProduct}
                  color={SEQUENTIAL_HUE}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border border-stone-200 dark:border-stone-800 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-4">
          <p className="text-sm font-semibold">Beliebteste Varianten nach Teil</p>
          {variationPartGroups.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-stone-500">Noch keine Bestellungen.</p>
          ) : (
            variationPartGroups.map((group) => (
              <div key={group.partName} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  {group.partName}
                </p>
                {group.variations.map((v) => (
                  <HBar
                    key={v.variation_name}
                    label={v.variation_name}
                    value={v.c}
                    max={group.max}
                    color={SEQUENTIAL_HUE}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3">
        <p className="text-sm font-semibold">Bestellungen pro Abschnitt</p>
        {byPeriod.length === 0 ? (
          <p className="text-xs text-stone-400 dark:text-stone-500">Noch keine Bestellungen.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {byPeriod.map((p) => (
              <HBar
                key={p.name}
                label={p.name}
                value={p.c}
                max={maxPeriod}
                color={SEQUENTIAL_HUE}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
