import { createClient, type Client, type InArgs } from "@libsql/client";
import path from "path";
import fs from "fs";

// Datenbank-Verbindung. Standardmäßig eine lokale SQLite-Datei (für die
// lokale Entwicklung und für Hoster mit persistentem Disk). Ist
// DATABASE_URL gesetzt (z. B. eine Turso-Adresse wie
// "libsql://mein-db-xyz.turso.io"), wird stattdessen diese
// Cloud-Datenbank benutzt – siehe DEPLOY.md, Abschnitt "Kostenlose
// Variante mit Turso". So läuft derselbe Code lokal (Datei) und in der
// Cloud (Turso), ohne dass man auf einem bezahlten Disk-Plan landet.
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const client: Client = createClient({
  url: DATABASE_URL || `file:${DB_PATH}`,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  haus INTEGER NOT NULL,
  etage INTEGER NOT NULL,
  zimmer INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, haus, etage, zimmer)
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_data TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ein Produkt kann aus mehreren "Teilen" (Parts) bestehen, z. B. Gehäuse,
-- Kappe, Clip. Für jeden Teil gibt es eigene Varianten (z. B. Farben).
CREATE TABLE IF NOT EXISTS product_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- mix_colors: JSON-Array zusätzlicher Hex-Farben, falls die Variante ein
-- Farb-Mix aus mehreren Farben ist (hex bleibt die erste/primäre Farbe).
-- sound_data: optionaler Sound als data:-URL (base64), z. B. ein
-- Klick-Geräusch für diese Variante.
-- stock_mode: 'on_demand' (immer bestellbar, wird auf Anfrage produziert)
-- oder 'stock' (Lagerbestand, siehe stock_count). Bei 'stock' und
-- stock_count = 0 gilt die Variante als ausverkauft.
CREATE TABLE IF NOT EXISTS part_variations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES product_parts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hex TEXT NOT NULL DEFAULT '#888888',
  mix_colors TEXT NOT NULL DEFAULT '[]',
  sound_data TEXT,
  stock_mode TEXT NOT NULL DEFAULT 'on_demand',
  stock_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- "Abschnitte"/Bestellzeiträume, vom Admin mit Start-/Enddatum angelegt.
-- Pro Nutzer:in gibt es je Abschnitt ein Credit-Guthaben (credits_per_period),
-- das beim Bestellen verbraucht wird.
CREATE TABLE IF NOT EXISTS order_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  credits_per_period INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- delivery_method: 'abholung' oder 'lieferung' (vom Nutzer beim Checkout
-- gewählt).
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  period_id INTEGER REFERENCES order_periods(id) ON DELETE SET NULL,
  delivery_method TEXT NOT NULL DEFAULT 'abholung',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'neu',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Für jede Bestellung: welche Variante wurde pro Teil gewählt.
-- part_name/variation_name sind eine Momentaufnahme (bleiben lesbar,
-- auch wenn der Teil/die Variante später umbenannt oder gelöscht wird).
CREATE TABLE IF NOT EXISTS order_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id INTEGER REFERENCES product_parts(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  variation_id INTEGER REFERENCES part_variations(id) ON DELETE SET NULL,
  variation_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Warenkorb: eine Zeile pro Produkt, das ein:e Nutzer:in in den Warenkorb
-- gelegt hat. selections_json speichert die gewählten Varianten
-- ([{partId, partName, variationId, variationName}]).
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  selections_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => (r as unknown as { name: string }).name === column);
}

let initPromise: Promise<void> | null = null;

// Legt fehlende Tabellen an und ergänzt fehlende Spalten bei
// Datenbanken, die mit einer älteren Version dieser App angelegt
// wurden. SQLite/libSQL kennt kein "ADD COLUMN IF NOT EXISTS", deshalb
// wird hier vorher per PRAGMA table_info geprüft.
async function initSchema(): Promise<void> {
  await client.executeMultiple(SCHEMA_SQL);

  const migrations: [string, string, string][] = [
    ["part_variations", "sort_order", `ALTER TABLE part_variations ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`],
    ["orders", "period_id", `ALTER TABLE orders ADD COLUMN period_id INTEGER`],
    ["part_variations", "mix_colors", `ALTER TABLE part_variations ADD COLUMN mix_colors TEXT NOT NULL DEFAULT '[]'`],
    ["part_variations", "sound_data", `ALTER TABLE part_variations ADD COLUMN sound_data TEXT`],
    ["part_variations", "stock_mode", `ALTER TABLE part_variations ADD COLUMN stock_mode TEXT NOT NULL DEFAULT 'on_demand'`],
    ["part_variations", "stock_count", `ALTER TABLE part_variations ADD COLUMN stock_count INTEGER NOT NULL DEFAULT 0`],
    ["order_periods", "credits_per_period", `ALTER TABLE order_periods ADD COLUMN credits_per_period INTEGER NOT NULL DEFAULT 3`],
    ["orders", "delivery_method", `ALTER TABLE orders ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'abholung'`],
  ];

  for (const [table, column, sql] of migrations) {
    if (!(await columnExists(table, column))) {
      await client.execute(sql);
    }
  }
}

function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initSchema();
  }
  return initPromise;
}

type SqlArgs = InArgs;

export type TxHelpers = {
  get<T = Record<string, unknown>>(sql: string, args?: SqlArgs): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, args?: SqlArgs): Promise<T[]>;
  run(sql: string, args?: SqlArgs): Promise<{ lastInsertRowid: number; changes: number }>;
};

async function get<T = Record<string, unknown>>(
  sql: string,
  args: SqlArgs = []
): Promise<T | undefined> {
  await ensureInit();
  const rs = await client.execute({ sql, args });
  return rs.rows[0] as unknown as T | undefined;
}

async function all<T = Record<string, unknown>>(
  sql: string,
  args: SqlArgs = []
): Promise<T[]> {
  await ensureInit();
  const rs = await client.execute({ sql, args });
  return rs.rows as unknown as T[];
}

async function run(
  sql: string,
  args: SqlArgs = []
): Promise<{ lastInsertRowid: number; changes: number }> {
  await ensureInit();
  const rs = await client.execute({ sql, args });
  return {
    lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
    changes: rs.rowsAffected,
  };
}

// Führt mehrere Schreib-Statements atomar aus (alles oder nichts) –
// Ersatz für das synchrone `db.transaction(fn)` von better-sqlite3.
async function transaction<T>(fn: (tx: TxHelpers) => Promise<T>): Promise<T> {
  await ensureInit();
  const tx = await client.transaction("write");
  const helpers: TxHelpers = {
    async get<R = Record<string, unknown>>(sql: string, args: SqlArgs = []) {
      const rs = await tx.execute({ sql, args });
      return rs.rows[0] as unknown as R | undefined;
    },
    async all<R = Record<string, unknown>>(sql: string, args: SqlArgs = []) {
      const rs = await tx.execute({ sql, args });
      return rs.rows as unknown as R[];
    },
    async run(sql: string, args: SqlArgs = []) {
      const rs = await tx.execute({ sql, args });
      return {
        lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
        changes: rs.rowsAffected,
      };
    },
  };

  try {
    const result = await fn(helpers);
    await tx.commit();
    return result;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

const db = { get, all, run, transaction };

export default db;
