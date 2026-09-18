import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCartItems } from "@/lib/cart";
import { getCreditsInfo } from "@/lib/periods";
import CheckoutForm from "./checkout-form";
import RemoveFromCartButton from "./remove-from-cart-button";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const items = await getCartItems(user.id);
  const credits = await getCreditsInfo(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Warenkorb</h1>
        {credits ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Du hast in &bdquo;{credits.period.name}&ldquo; noch{" "}
            <strong>{credits.remaining}</strong> von {credits.total} Credits.
          </p>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Gerade ist kein Bestellzeitraum aktiv – du kannst deinen
            Warenkorb erst abschicken, wenn wieder einer läuft.
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Dein Warenkorb ist leer.{" "}
          <Link href="/" className="underline">
            Zum Shop
          </Link>
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-stone-200 dark:border-stone-800 rounded-xl p-3 bg-white dark:bg-stone-900 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {item.selections
                      .map((s) => `${s.partName}: ${s.variationName}`)
                      .join(" · ")}
                  </p>
                </div>
                <RemoveFromCartButton id={item.id} />
              </div>
            ))}
          </div>

          <CheckoutForm
            itemCount={items.length}
            creditsRemaining={credits?.remaining ?? 0}
            hasActivePeriod={!!credits}
          />
        </>
      )}
    </div>
  );
}
