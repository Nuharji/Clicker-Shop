import db from "./db";

export type CartSelection = {
  partId: number;
  partName: string;
  variationId: number;
  variationName: string;
};

export type CartItem = {
  id: number;
  product_id: number;
  product_name: string;
  selections: CartSelection[];
  created_at: string;
};

type CartItemRow = {
  id: number;
  product_id: number;
  product_name: string;
  selections_json: string;
  created_at: string;
};

export async function getCartItems(userId: number): Promise<CartItem[]> {
  const rows = await db.all<CartItemRow>(
    `SELECT id, product_id, product_name, selections_json, created_at
     FROM cart_items WHERE user_id = ? ORDER BY created_at ASC, id ASC`,
    [userId]
  );

  return rows.map((r) => {
    let selections: CartSelection[] = [];
    try {
      const parsed = JSON.parse(r.selections_json);
      if (Array.isArray(parsed)) selections = parsed;
    } catch {
      selections = [];
    }
    return {
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      selections,
      created_at: r.created_at,
    };
  });
}

export async function getCartCount(userId: number): Promise<number> {
  const row = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM cart_items WHERE user_id = ?`,
    [userId]
  );
  return row?.c ?? 0;
}
