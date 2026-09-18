import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isAdminSession } from "@/lib/auth";
import { toggleProductActiveAction, deletePartAction } from "../actions";
import AddProductForm from "./add-product-form";
import PartForm from "./part-form";
import VariationForm from "./variation-form";
import VariationRow from "./variation-row";
import DeleteProductButton from "./delete-product-button";

type Product = {
  id: number;
  name: string;
  description: string;
  image_data: string | null;
  active: number;
};

type Part = {
  id: number;
  name: string;
  product_id: number;
  sort_order: number;
};

type Variation = {
  id: number;
  name: string;
  hex: string;
  mix_colors: string;
  sound_data: string | null;
  stock_mode: string;
  stock_count: number;
  active: number;
  part_id: number;
  sort_order: number;
};

export default async function AdminProductsPage() {
  if (!(await isAdminSession())) {
    redirect("/login");
  }

  const products = await db.all<Product>(
    `SELECT id, name, description, image_data, active FROM products ORDER BY created_at DESC`
  );

  const parts = await db.all<Part>(
    `SELECT id, name, product_id, sort_order FROM product_parts ORDER BY sort_order ASC, id ASC`
  );

  const variations = await db.all<Variation>(
    `SELECT id, name, hex, mix_colors, sound_data, stock_mode, stock_count, active, part_id, sort_order FROM part_variations ORDER BY sort_order ASC, id ASC`
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Produkte verwalten</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Neue Produkte mit Teilen &amp; Varianten, und Sichtbarkeit im Shop.
        </p>
      </div>

      <AddProductForm />

      <div className="flex flex-col gap-4">
        {products.map((p) => {
          const productParts = parts.filter((pt) => pt.product_id === p.id);
          return (
            <div
              key={p.id}
              className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  {p.image_data && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_data}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded-lg bg-stone-100 dark:bg-stone-800"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{p.description}</p>
                    <p className="text-xs mt-1">
                      {p.active ? (
                        <span className="text-green-600 dark:text-green-400">Sichtbar im Shop</span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500">Ausgeblendet</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-1.5 rounded-full whitespace-nowrap">
                      {p.active ? "Ausblenden" : "Einblenden"}
                    </button>
                  </form>
                  <DeleteProductButton id={p.id} name={p.name} />
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    Teile &amp; Varianten
                  </p>
                  <PartForm productId={p.id} />
                </div>

                {productParts.length === 0 && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Noch keine Teile – dieses Produkt wird ohne Auswahl
                    bestellt.
                  </p>
                )}

                {productParts.map((part) => {
                  const partVariations = variations.filter(
                    (v) => v.part_id === part.id
                  );
                  return (
                    <div
                      key={part.id}
                      className="border border-stone-100 dark:border-stone-800 rounded-lg p-3 bg-stone-50 dark:bg-stone-950 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{part.name}</p>
                        <form action={deletePartAction}>
                          <input type="hidden" name="id" value={part.id} />
                          <button
                            title="Teil löschen"
                            className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 px-1"
                          >
                            Teil löschen
                          </button>
                        </form>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {partVariations.map((v, index) => (
                          <VariationRow
                            key={v.id}
                            variation={v}
                            isFirst={index === 0}
                            isLast={index === partVariations.length - 1}
                          />
                        ))}
                        <VariationForm partId={part.id} />
                      </div>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">
                        Klick auf den Namen zum Bearbeiten, ↑↓ zum Sortieren.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
