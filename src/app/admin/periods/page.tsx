import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isAdminSession } from "@/lib/auth";
import AddPeriodForm from "./add-period-form";
import DeletePeriodButton from "./delete-period-button";

type PeriodRow = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  credits_per_period: number;
  order_count: number;
};

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

export default async function AdminPeriodsPage() {
  if (!(await isAdminSession())) {
    redirect("/login");
  }

  const periods = await db.all<PeriodRow>(
    `SELECT p.id, p.name, p.start_date, p.end_date, p.credits_per_period,
            (SELECT COUNT(*) FROM orders o WHERE o.period_id = p.id) AS order_count
     FROM order_periods p
     ORDER BY p.start_date DESC`
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Bestellabschnitte</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Nur innerhalb eines aktiven Abschnitts kann bestellt werden – pro
          Person gibt es je Abschnitt ein Credit-Guthaben, das du hier
          festlegst.
        </p>
      </div>

      <AddPeriodForm />

      <div className="flex flex-col gap-3">
        {periods.length === 0 && (
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            Noch keine Abschnitte angelegt – ohne Abschnitt kann aktuell
            niemand bestellen.
          </p>
        )}
        {periods.map((p) => {
          const isActive = p.start_date <= today && p.end_date >= today;
          return (
            <div
              key={p.id}
              className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-white dark:bg-stone-900 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium flex items-center gap-2">
                  {p.name}
                  {isActive && (
                    <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      aktiv
                    </span>
                  )}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {formatDate(p.start_date)} – {formatDate(p.end_date)} ·{" "}
                  {p.credits_per_period} Credits/Person ·{" "}
                  {p.order_count} Bestellung{p.order_count === 1 ? "" : "en"}
                </p>
              </div>
              <DeletePeriodButton id={p.id} name={p.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
