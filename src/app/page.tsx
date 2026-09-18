import Link from "next/link";
import db from "@/lib/db";
import { swatchBackground } from "@/lib/colorMix";
import { isSoldOut } from "@/lib/stock";

type Product = {
  id: number;
  name: string;
  description: string;
  image_data: string | null;
};

type Variation = {
  id: number;
  hex: string;
  mix_colors: string;
  stock_mode: string;
  stock_count: number;
  part_id: number;
  product_id: number;
};

export default async function Home() {
  const products = await db.all<Product>(
    `SELECT id, name, description, image_data FROM products WHERE active = 1 ORDER BY sort_order ASC, created_at DESC`
  );

  const variations = await db.all<Variation>(
    `SELECT v.id, v.hex, v.mix_colors, v.stock_mode, v.stock_count, v.part_id, pt.product_id AS product_id
     FROM part_variations v
     JOIN product_parts pt ON pt.id = v.part_id
     WHERE v.active = 1
     ORDER BY pt.sort_order ASC, v.sort_order ASC, v.id ASC`
  );

  // Ein Produkt gilt als ausverkauft, wenn es Teile hat und für
  // mindestens eines davon KEINE Variante mehr verfügbar ist.
  function isProductSoldOut(productId: number): boolean {
    const productVariations = variations.filter((v) => v.product_id === productId);
    if (productVariations.length === 0) return false;
    const byPart = new Map<number, Variation[]>();
    for (const v of productVariations) {
      const arr = byPart.get(v.part_id) ?? [];
      arr.push(v);
      byPart.set(v.part_id, arr);
    }
    for (const partVariations of byPart.values()) {
      if (partVariations.every((v) => isSoldOut(v))) return true;
    }
    return false;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dumpling Clicker 🥟</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">
        3D-gedruckte Fidgets, kostenlos für alle im Internat. Produkt
        anklicken, Variante auswählen, wir bringen sie in dein Zimmer bzw.
        du kannst sie abholen.
      </p>

      {products.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400">
          Gerade sind keine Produkte verfügbar – schau später nochmal
          vorbei.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((p) => {
          const swatches = variations.filter((v) => v.product_id === p.id);
          const soldOut = isProductSoldOut(p.id);
          return (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3 hover:border-stone-400 dark:hover:border-stone-600 transition-colors relative"
            >
              {soldOut && (
                <span className="absolute top-2 right-2 text-[11px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                  Ausverkauft
                </span>
              )}
              {p.image_data && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_data}
                  alt={p.name}
                  className={`w-full h-40 object-cover rounded-lg bg-stone-100 dark:bg-stone-800 ${
                    soldOut ? "opacity-50" : ""
                  }`}
                />
              )}
              <div>
                <h2 className="font-semibold text-lg">{p.name}</h2>
                {p.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>
              {swatches.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {swatches.map((v) => (
                    <span
                      key={v.id}
                      className={`w-4 h-4 rounded-full border border-black/10 dark:border-white/20 ${
                        isSoldOut(v) ? "opacity-30" : ""
                      }`}
                      style={{ background: swatchBackground(v.hex, v.mix_colors) }}
                    />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
