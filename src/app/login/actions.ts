"use server";

import { redirect } from "next/navigation";
import db from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string };

type UserRow = {
  id: number;
  name: string;
  password_hash: string;
};

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") || "").trim();
  const haus = Number(formData.get("haus"));
  const etage = Number(formData.get("etage"));
  const zimmer = Number(formData.get("zimmer"));
  const password = String(formData.get("password") || "");

  const user = await db.get<UserRow>(
    `SELECT id, name, password_hash FROM users WHERE LOWER(name) = LOWER(?) AND haus = ? AND etage = ? AND zimmer = ?`,
    [name, haus, etage, zimmer]
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Name, Zimmer oder Passwort ist falsch." };
  }

  await createSessionCookie({ type: "user", id: user.id, name: user.name });
  redirect("/");
}

type AdminRow = {
  id: number;
  username: string;
  password_hash: string;
};

export async function adminLoginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  const admin = await db.get<AdminRow>(
    `SELECT id, username, password_hash FROM admins WHERE LOWER(username) = LOWER(?)`,
    [username]
  );

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return { error: "Benutzername oder Passwort ist falsch." };
  }

  await createSessionCookie({
    type: "admin",
    id: admin.id,
    name: admin.username,
  });
  redirect("/admin/orders");
}
