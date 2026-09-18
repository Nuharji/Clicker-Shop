"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isAdminSession } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/status";
import { sanitizeMixColors } from "@/lib/colorMix";

export type FormState = { error?: string };

async function requireAdmin() {
  if (!(await isAdminSession())) {
    redirect("/login");
  }
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_SOUND_BYTES = 3 * 1024 * 1024; // 3 MB

async function fileToDataUrl(
  file: File | null,
  maxBytes: number,
  tooLargeMessage: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > maxBytes) {
    throw new Error(tooLargeMessage);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  return `data:${file.type};base64,${base64}`;
}

type DraftVariation = { name: string; hex?: string };
type DraftPart = { name: string; variations?: DraftVariation[] };

export async function addProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageFile = formData.get("image") as File | null;
  const partsJson = String(formData.get("partsJson") || "[]");

  if (name.length < 2) {
    return { error: "Bitte einen Produktnamen eingeben." };
  }

  let draftParts: DraftPart[] = [];
  try {
    const parsed = JSON.parse(partsJson);
    if (Array.isArray(parsed)) draftParts = parsed;
  } catch {
    // ignoriere kaputtes JSON, Produkt wird einfach ohne Teile angelegt
  }

  let imageData: string | null = null;
  try {
    imageData = await fileToDataUrl(
      imageFile,
      MAX_IMAGE_BYTES,
      "Bild ist zu groß (max. 2 MB)."
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Bildfehler." };
  }

  await db.transaction(async (tx) => {
    const productResult = await tx.run(
      `INSERT INTO products (name, description, image_data) VALUES (?, ?, ?)`,
      [name, description, imageData]
    );
    const productId = productResult.lastInsertRowid;

    let partSort = 0;
    for (const part of draftParts) {
      const partName = String(part?.name || "").trim();
      if (!partName) continue;
      const partResult = await tx.run(
        `INSERT INTO product_parts (product_id, name, sort_order) VALUES (?, ?, ?)`,
        [productId, partName, partSort++]
      );
      const partId = partResult.lastInsertRowid;

      for (const variation of part?.variations || []) {
        const variationName = String(variation?.name || "").trim();
        if (!variationName) continue;
        await tx.run(
          `INSERT INTO part_variations (part_id, name, hex) VALUES (?, ?, ?)`,
          [partId, variationName, variation?.hex || "#888888"]
        );
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageFile = formData.get("image") as File | null;

  const imageData = await fileToDataUrl(
    imageFile,
    MAX_IMAGE_BYTES,
    "Bild ist zu groß (max. 2 MB)."
  );

  if (imageData) {
    await db.run(
      `UPDATE products SET name = ?, description = ?, image_data = ? WHERE id = ?`,
      [name, description, imageData, id]
    );
  } else {
    await db.run(
      `UPDATE products SET name = ?, description = ? WHERE id = ?`,
      [name, description, id]
    );
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`UPDATE products SET active = 1 - active WHERE id = ?`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`DELETE FROM products WHERE id = ?`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function addPartAction(formData: FormData) {
  await requireAdmin();
  const productId = Number(formData.get("productId"));
  const name = String(formData.get("name") || "").trim();
  if (name.length < 1) return;

  const maxSort = await db.get<{ m: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_parts WHERE product_id = ?`,
    [productId]
  );

  await db.run(
    `INSERT INTO product_parts (product_id, name, sort_order) VALUES (?, ?, ?)`,
    [productId, name, (maxSort?.m ?? -1) + 1]
  );

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deletePartAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`DELETE FROM product_parts WHERE id = ?`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function addVariationAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const partId = Number(formData.get("partId"));
  const name = String(formData.get("name") || "").trim();
  const hex = String(formData.get("hex") || "#888888");
  const mixColors = sanitizeMixColors(formData.getAll("mixColor") as string[]);
  const soundFile = formData.get("sound") as File | null;
  const stockMode = formData.get("stockMode") === "stock" ? "stock" : "on_demand";
  const stockCount = Math.max(0, Number(formData.get("stockCount")) || 0);

  if (name.length < 1) return {};

  let soundData: string | null = null;
  try {
    soundData = await fileToDataUrl(
      soundFile,
      MAX_SOUND_BYTES,
      "Sound-Datei ist zu groß (max. 3 MB)."
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sound-Fehler." };
  }

  const maxSort = await db.get<{ m: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) AS m FROM part_variations WHERE part_id = ?`,
    [partId]
  );

  await db.run(
    `INSERT INTO part_variations (part_id, name, hex, mix_colors, sound_data, stock_mode, stock_count, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      partId,
      name,
      hex,
      JSON.stringify(mixColors),
      soundData,
      stockMode,
      stockMode === "stock" ? stockCount : 0,
      (maxSort?.m ?? -1) + 1,
    ]
  );

  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

export async function updateVariationAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const hex = String(formData.get("hex") || "#888888");
  const mixColors = sanitizeMixColors(formData.getAll("mixColor") as string[]);
  const soundFile = formData.get("sound") as File | null;
  const removeSound = formData.get("removeSound") === "1";
  const stockMode = formData.get("stockMode") === "stock" ? "stock" : "on_demand";
  const stockCount =
    stockMode === "stock" ? Math.max(0, Number(formData.get("stockCount")) || 0) : 0;
  if (name.length < 1) return {};

  let soundData: string | null = null;
  try {
    soundData = await fileToDataUrl(
      soundFile,
      MAX_SOUND_BYTES,
      "Sound-Datei ist zu groß (max. 3 MB)."
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sound-Fehler." };
  }

  if (soundData) {
    await db.run(
      `UPDATE part_variations SET name = ?, hex = ?, mix_colors = ?, sound_data = ?, stock_mode = ?, stock_count = ? WHERE id = ?`,
      [name, hex, JSON.stringify(mixColors), soundData, stockMode, stockCount, id]
    );
  } else if (removeSound) {
    await db.run(
      `UPDATE part_variations SET name = ?, hex = ?, mix_colors = ?, sound_data = NULL, stock_mode = ?, stock_count = ? WHERE id = ?`,
      [name, hex, JSON.stringify(mixColors), stockMode, stockCount, id]
    );
  } else {
    await db.run(
      `UPDATE part_variations SET name = ?, hex = ?, mix_colors = ?, stock_mode = ?, stock_count = ? WHERE id = ?`,
      [name, hex, JSON.stringify(mixColors), stockMode, stockCount, id]
    );
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

type VariationOrderRow = { id: number; part_id: number; sort_order: number };

export async function moveVariationAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const direction = String(formData.get("direction") || "");

  const current = await db.get<VariationOrderRow>(
    `SELECT id, part_id, sort_order FROM part_variations WHERE id = ?`,
    [id]
  );
  if (!current) return;

  const siblings = await db.all<VariationOrderRow>(
    `SELECT id, part_id, sort_order FROM part_variations WHERE part_id = ? ORDER BY sort_order ASC, id ASC`,
    [current.part_id]
  );

  const index = siblings.findIndex((s) => s.id === current.id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];

  await db.transaction(async (tx) => {
    await tx.run(`UPDATE part_variations SET sort_order = ? WHERE id = ?`, [
      other.sort_order,
      current.id,
    ]);
    await tx.run(`UPDATE part_variations SET sort_order = ? WHERE id = ?`, [
      current.sort_order,
      other.id,
    ]);
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleVariationActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`UPDATE part_variations SET active = 1 - active WHERE id = ?`, [
    id,
  ]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteVariationAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`DELETE FROM part_variations WHERE id = ?`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function addPeriodAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const credits = Math.max(1, Number(formData.get("credits")) || 3);

  if (name.length < 1) {
    return { error: "Bitte einen Namen für den Abschnitt eingeben." };
  }
  if (!startDate || !endDate) {
    return { error: "Bitte Start- und Enddatum angeben." };
  }
  if (endDate < startDate) {
    return { error: "Das Enddatum darf nicht vor dem Startdatum liegen." };
  }

  await db.run(
    `INSERT INTO order_periods (name, start_date, end_date, credits_per_period) VALUES (?, ?, ?, ?)`,
    [name, startDate, endDate, credits]
  );

  revalidatePath("/admin/periods");
  return {};
}

export async function deletePeriodAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.run(`DELETE FROM order_periods WHERE id = ?`, [id]);
  revalidatePath("/admin/periods");
}

const VALID_STATUSES = new Set(ORDER_STATUSES.map((s) => s.value));

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");

  if (!VALID_STATUSES.has(status as (typeof ORDER_STATUSES)[number]["value"])) {
    return;
  }

  await db.run(
    `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, id]
  );

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
