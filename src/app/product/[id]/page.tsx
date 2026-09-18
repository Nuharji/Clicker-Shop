import { notFound } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCreditsInfo } from "@/lib/periods";
import OrderForm from "../../order-form";

type Product = {
  id: number;
  name: string;
  description: string;
  image_data: string | null;
  active: number;
};

type Part = { id: number; name: string; product_id: number; sort_order: number };
type Variation = {
  id: number;
  name: string;
  hex: string;
  mix_colors: string;
  sound_data: string | null;
  stock_mode: string;
  stock_count: number;
  part_id: number;
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const product = await db.get<Product>(
    `SELECT id, name, description, image_data, active FROM products WHERE id = ?`,
    [productId]
  );

  if (!product || !product.active) {
    notFound();
  }

  const user = await getCurrentUser();

  const parts = await db.all<Part>(
    `SELECT id, name, product_id, sort_order FROM product_parts WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [product.id]
  );

  const variations = parts.length
    ? await db.all<Variation>(
        `SELECT v.id, v.name, v.hex, v.mix_colors, v.sound_data, v.stock_mode, v.stock_count, v.part_id FROM part_variations v
         WHERE v.part_id IN (${parts.map(() => "?").join(",")}) AND v.active = 1
         ORDER BY v.sort_order ASC, v.id ASC`,
        parts.map((p) => p.id)
      )
    : [];

  const productParts = parts
    .map((pt) => ({
      id: pt.id,
      name: pt.name,
      variations: variations.filter((v) => v.part_id === pt.id),
    }))
    .filter((pt) => pt.variations.length > 0);

  const credits = user ? await getCreditsInfo(user.id) : null;

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 dark:text-stone-400 hover:underline">
        ← Zurück zum Shop
      </Link>

      <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-4 mt-3">
        {product.image_data && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_data}
            alt={product.name}
            className="w-full max-h-72 object-cover rounded-lg bg-stone-100 dark:bg-stone-800"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.description && (
            <p className="text-stone-500 dark:text-stone-400 mt-1">{product.description}</p>
          )}
        </div>

        {user && (
          <p className="text-xs text-stone-500 dark:text-stone-400 -mt-2">
            {credits
              ? credits.remaining > 0
                ? `Du hast in "${credits.period.name}" noch ${credits.remaining} von ${credits.total} Credits.`
                : `Du hast in "${credits.period.name}" bereits alle ${credits.total} Credits verbraucht.`
              : "Gerade ist kein Bestellzeitraum aktiv."}
          </p>
        )}

        <OrderForm
          productId={product.id}
          parts={productParts}
          loggedIn={!!user}
        />
      </div>
    </div>
  );
}
