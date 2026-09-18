"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSoldOut } from "@/lib/stock";

export type FormState = { error?: string; success?: boolean };

type ProductRow = { id: number; name: string; active: number };
type PartRow = { id: number; name: string; product_id: number; sort_order: number };
type VariationRow = {
  id: number;
  name: string;
  part_id: number;
  active: number;
  stock_mode: string;
  stock_count: number;
};

// Legt ein Produkt (mit den gewählten Varianten je Teil) in den
// Warenkorb der eingeloggten Person. Die eigentliche Bestellung
// entsteht erst beim Checkout im Warenkorb (/cart), damit man mehrere
// Produkte sammeln kann, bevor man Liefer-/Abholart wählt.
export async function addToCartAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Bitte zuerst einloggen." };
  }

  const productId = Number(formData.get("productId"));

  const product = await db.get<ProductRow>(
    "SELECT id, name, active FROM products WHERE id = ?",
    [productId]
  );

  if (!product || !product.active) {
    return { error: "Dieses Produkt ist gerade nicht verfügbar." };
  }

  const parts = await db.all<PartRow>(
    `SELECT id, name, product_id, sort_order FROM product_parts WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [product.id]
  );

  const selections: {
    partId: number;
    partName: string;
    variationId: number;
    variationName: string;
  }[] = [];

  for (const part of parts) {
    const variationId = Number(formData.get(`part_${part.id}`));
    if (!variationId) {
      return { error: `Bitte für „${part.name}“ eine Variante wählen.` };
    }

    const variation = await db.get<VariationRow>(
      `SELECT id, name, part_id, active, stock_mode, stock_count FROM part_variations WHERE id = ?`,
      [variationId]
    );

    if (!variation || !variation.active || variation.part_id !== part.id) {
      return {
        error: `Die gewählte Variante für „${part.name}“ ist nicht mehr verfügbar.`,
      };
    }

    if (isSoldOut(variation)) {
      return {
        error: `„${variation.name}“ (${part.name}) ist leider ausverkauft.`,
      };
    }

    selections.push({
      partId: part.id,
      partName: part.name,
      variationId: variation.id,
      variationName: variation.name,
    });
  }

  await db.run(
    `INSERT INTO cart_items (user_id, product_id, product_name, selections_json) VALUES (?, ?, ?, ?)`,
    [user.id, product.id, product.name, JSON.stringify(selections)]
  );

  revalidatePath("/cart");
  return { success: true };
}
