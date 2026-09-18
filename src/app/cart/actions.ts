"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartItems, type CartItem } from "@/lib/cart";
import { getActivePeriod, countUserOrdersInPeriod } from "@/lib/periods";
import { isSoldOut } from "@/lib/stock";

export type FormState = { error?: string };

export async function removeFromCartAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = Number(formData.get("id"));
  await db.run(`DELETE FROM cart_items WHERE id = ? AND user_id = ?`, [
    id,
    user.id,
  ]);
  revalidatePath("/cart");
}

type VariationStockRow = {
  id: number;
  name: string;
  active: number;
  stock_mode: string;
  stock_count: number;
};

export async function checkoutCartAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Bitte zuerst einloggen." };
  }

  const deliveryMethod = String(formData.get("deliveryMethod") || "abholung");
  if (!["abholung", "lieferung"].includes(deliveryMethod)) {
    return { error: "Bitte Lieferung oder Abholung wählen." };
  }
  const note = String(formData.get("note") || "").trim().slice(0, 300);

  const items: CartItem[] = await getCartItems(user.id);
  if (items.length === 0) {
    return { error: "Dein Warenkorb ist leer." };
  }

  const period = await getActivePeriod();
  if (!period) {
    return {
      error:
        "Gerade ist kein Bestellzeitraum aktiv. Frag den Admin, wann wieder bestellt werden kann.",
    };
  }

  const alreadyUsed = await countUserOrdersInPeriod(user.id, period.id);
  const remaining = period.credits_per_period - alreadyUsed;
  if (items.length > remaining) {
    return {
      error:
        remaining <= 0
          ? `Du hast in "${period.name}" bereits alle Credits verbraucht.`
          : `Du hast in "${period.name}" nur noch ${remaining} Credit(s), aber ${items.length} Artikel im Warenkorb.`,
    };
  }

  // Bestand für alle Positionen erneut prüfen (kann sich seit dem
  // Hinzufügen zum Warenkorb geändert haben).
  for (const item of items) {
    for (const sel of item.selections) {
      const variation = await db.get<VariationStockRow>(
        `SELECT id, name, active, stock_mode, stock_count FROM part_variations WHERE id = ?`,
        [sel.variationId]
      );
      if (!variation || !variation.active) {
        return {
          error: `„${sel.variationName}“ ist nicht mehr verfügbar. Bitte im Warenkorb prüfen.`,
        };
      }
      if (isSoldOut(variation)) {
        return {
          error: `„${variation.name}“ ist mittlerweile ausverkauft. Bitte im Warenkorb anpassen.`,
        };
      }
    }
  }

  await db.transaction(async (tx) => {
    for (const item of items) {
      const orderResult = await tx.run(
        `INSERT INTO orders (user_id, product_id, product_name, period_id, delivery_method, note, status)
         VALUES (?, ?, ?, ?, ?, ?, 'neu')`,
        [user.id, item.product_id, item.product_name, period.id, deliveryMethod, note]
      );
      const orderId = orderResult.lastInsertRowid;

      for (const [index, s] of item.selections.entries()) {
        await tx.run(
          `INSERT INTO order_selections (order_id, part_id, part_name, variation_id, variation_name, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, s.partId, s.partName, s.variationId, s.variationName, index]
        );
        await tx.run(
          `UPDATE part_variations SET stock_count = stock_count - 1
           WHERE id = ? AND stock_mode = 'stock' AND stock_count > 0`,
          [s.variationId]
        );
      }

      await tx.run(`DELETE FROM cart_items WHERE id = ?`, [item.id]);
    }
  });

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/admin/products");
  redirect("/orders");
}
