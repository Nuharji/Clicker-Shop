// Verfügbarkeits-Logik für Varianten mit Lagerbestand.
//
// stock_mode "on_demand": immer bestellbar (wird auf Anfrage produziert).
// stock_mode "stock": nur bestellbar, solange stock_count > 0.

export type StockInfo = { stock_mode: string; stock_count: number };

export function isSoldOut(v: StockInfo): boolean {
  return v.stock_mode === "stock" && v.stock_count <= 0;
}

export function isAvailable(v: StockInfo): boolean {
  return !isSoldOut(v);
}
