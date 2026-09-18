import db from "./db";

// Fallback, falls für einen Abschnitt (aus irgendeinem Grund) kein
// credits_per_period gesetzt ist.
export const MAX_ORDERS_PER_PERIOD = 3;

export type OrderPeriod = {
  id: number;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  credits_per_period: number;
};

// Heutiges Datum als YYYY-MM-DD (lokale Serverzeit).
function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getActivePeriod(): Promise<OrderPeriod | null> {
  const today = todayStr();
  const row = await db.get<OrderPeriod>(
    `SELECT id, name, start_date, end_date, credits_per_period FROM order_periods
     WHERE start_date <= ? AND end_date >= ?
     ORDER BY start_date DESC LIMIT 1`,
    [today, today]
  );
  return row ?? null;
}

export async function countUserOrdersInPeriod(
  userId: number,
  periodId: number
): Promise<number> {
  const row = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND period_id = ?`,
    [userId, periodId]
  );
  return row?.c ?? 0;
}

export type CreditsInfo = {
  period: OrderPeriod;
  total: number;
  used: number;
  remaining: number;
};

// Credits ersetzen das frühere feste "max. 3 Bestellungen pro Abschnitt"-
// Limit: jede:r Nutzer:in bekommt pro aktivem Abschnitt ein Guthaben
// (credits_per_period), das pro aufgegebener Bestellung um 1 sinkt.
export async function getCreditsInfo(userId: number): Promise<CreditsInfo | null> {
  const period = await getActivePeriod();
  if (!period) return null;
  const used = await countUserOrdersInPeriod(userId, period.id);
  const total = period.credits_per_period ?? MAX_ORDERS_PER_PERIOD;
  return {
    period,
    total,
    used,
    remaining: Math.max(0, total - used),
  };
}
