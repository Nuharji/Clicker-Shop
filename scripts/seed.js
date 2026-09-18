/*
 * Legt (falls nicht vorhanden) einen Admin-Account an und optional ein
 * Beispiel-Produkt. Aufruf (lokale Datei):
 *
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=deinPasswort node scripts/seed.js
 *
 * Für eine externe Turso-Datenbank stattdessen zusätzlich DATABASE_URL
 * (und ggf. DATABASE_AUTH_TOKEN) setzen:
 *
 *   DATABASE_URL=libsql://mein-db-xyz.turso.io \
 *   DATABASE_AUTH_TOKEN=... \
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=deinPasswort \
 *   node scripts/seed.js
 *
 * Kann beliebig oft ausgeführt werden (ist idempotent für den Admin-Account:
 * wenn der Benutzername schon existiert, wird nur das Passwort NICHT
 * überschrieben, sondern die Ausführung übersprungen).
 */

const path = require("path");
const fs = require("fs");
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "app.db");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = createClient({
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
CREATE TABLE IF NOT EXISTS product_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
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
CREATE TABLE IF NOT EXISTS order_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  credits_per_period INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
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
CREATE TABLE IF NOT EXISTS order_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id INTEGER REFERENCES product_parts(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  variation_id INTEGER REFERENCES part_variations(id) ON DELETE SET NULL,
  variation_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  selections_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function columnExists(table, column) {
  const rs = await db.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => r.name === column);
}

async function ensureSchema() {
  await db.executeMultiple(SCHEMA_SQL);

  const migrations = [
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
      await db.execute(sql);
    }
  }
}

async function main() {
  await ensureSchema();

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;

  const existingAdminRs = await db.execute({
    sql: "SELECT id FROM admins WHERE LOWER(username) = LOWER(?)",
    args: [username],
  });

  if (existingAdminRs.rows[0]) {
    console.log(`Admin "${username}" existiert schon – überspringe.`);
  } else {
    if (!password) {
      console.error(
        "Kein ADMIN_PASSWORD gesetzt. Beispiel:\n" +
          "  ADMIN_USERNAME=admin ADMIN_PASSWORD=deinPasswort node scripts/seed.js"
      );
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 10);
    await db.execute({
      sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
      args: [username, hash],
    });
    console.log(`Admin-Account "${username}" wurde angelegt.`);
  }

  const productCountRs = await db.execute("SELECT COUNT(*) AS c FROM products");
  const productCount = Number(productCountRs.rows[0]?.c ?? 0);

  if (productCount === 0) {
    const productResult = await db.execute({
      sql: "INSERT INTO products (name, description) VALUES (?, ?)",
      args: [
        "Dumpling Clicker Classic",
        "Der Original-Dumpling-Fidget zum Klicken, 3D-gedruckt.",
      ],
    });
    const productId = Number(productResult.lastInsertRowid);
    const partResult = await db.execute({
      sql: "INSERT INTO product_parts (product_id, name, sort_order) VALUES (?, ?, 0)",
      args: [productId, "Farbe"],
    });
    const partId = Number(partResult.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO part_variations (part_id, name, hex) VALUES (?, ?, ?)",
      args: [partId, "Weiß", "#f5f5f4"],
    });
    await db.execute({
      sql: "INSERT INTO part_variations (part_id, name, hex) VALUES (?, ?, ?)",
      args: [partId, "Schwarz", "#1c1917"],
    });
    console.log("Beispiel-Produkt angelegt (kannst du im Admin-Bereich bearbeiten/löschen).");
  }

  const periodCountRs = await db.execute("SELECT COUNT(*) AS c FROM order_periods");
  const periodCount = Number(periodCountRs.rows[0]?.c ?? 0);

  if (periodCount === 0) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const fmt = (d) => d.toISOString().slice(0, 10);
    await db.execute({
      sql: "INSERT INTO order_periods (name, start_date, end_date) VALUES (?, ?, ?)",
      args: ["Erster Bestellzeitraum", fmt(start), fmt(end)],
    });
    console.log(
      "Ersten Bestellabschnitt angelegt (30 Tage ab heute, im Admin-Bereich unter 'Abschnitte' anpassbar)."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
