"use server";

import { redirect } from "next/navigation";
import db from "@/lib/db";
import { isValidAddress, MAX_ACCOUNTS_PER_ROOM } from "@/lib/address";
import { createSessionCookie, hashPassword } from "@/lib/auth";

export type FormState = { error?: string };

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") || "").trim();
  const haus = Number(formData.get("haus"));
  const etage = Number(formData.get("etage"));
  const zimmer = Number(formData.get("zimmer"));
  const password = String(formData.get("password") || "");
  const password2 = String(formData.get("password2") || "");

  if (name.length < 2) {
    return { error: "Bitte gib deinen Namen ein (mind. 2 Zeichen)." };
  }
  if (!isValidAddress(haus, etage, zimmer)) {
    return { error: "Diese Haus/Etage/Zimmer-Kombination gibt es nicht." };
  }
  if (password.length < 4) {
    return { error: "Das Passwort muss mindestens 4 Zeichen haben." };
  }
  if (password !== password2) {
    return { error: "Die Passwörter stimmen nicht überein." };
  }

  const existing = await db.get<{ id: number }>(
    `SELECT id FROM users WHERE LOWER(name) = LOWER(?) AND haus = ? AND etage = ? AND zimmer = ?`,
    [name, haus, etage, zimmer]
  );

  if (existing) {
    return {
      error:
        "Mit diesem Namen und Zimmer gibt es schon ein Konto. Bitte einloggen.",
    };
  }

  const roomCount = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM users WHERE haus = ? AND etage = ? AND zimmer = ?`,
    [haus, etage, zimmer]
  );

  if ((roomCount?.c ?? 0) >= MAX_ACCOUNTS_PER_ROOM) {
    return {
      error: `Für dieses Zimmer gibt es schon ${MAX_ACCOUNTS_PER_ROOM} Konten (Maximum). Bitte mit einem bestehenden Konto einloggen oder jemanden bitten, sein Passwort zu teilen.`,
    };
  }

  const passwordHash = await hashPassword(password);

  const result = await db.run(
    `INSERT INTO users (name, haus, etage, zimmer, password_hash) VALUES (?, ?, ?, ?, ?)`,
    [name, haus, etage, zimmer, passwordHash]
  );

  await createSessionCookie({
    type: "user",
    id: Number(result.lastInsertRowid),
    name,
  });

  redirect("/");
}
