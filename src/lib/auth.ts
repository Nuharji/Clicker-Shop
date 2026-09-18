import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import db from "./db";

const COOKIE_NAME = "session";
const secretString =
  process.env.SESSION_SECRET ||
  "dev-only-insecure-secret-change-me-in-production-please";
const secret = new TextEncoder().encode(secretString);

export type SessionPayload = {
  type: "user" | "admin";
  id: number;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      (payload.type === "user" || payload.type === "admin") &&
      typeof payload.id === "number" &&
      typeof payload.name === "string"
    ) {
      return {
        type: payload.type,
        id: payload.id,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: number;
  name: string;
  haus: number;
  etage: number;
  zimmer: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session || session.type !== "user") return null;
  const row = await db.get<CurrentUser>(
    "SELECT id, name, haus, etage, zimmer FROM users WHERE id = ?",
    [session.id]
  );
  return row ?? null;
}

export async function isAdminSession(): Promise<boolean> {
  const session = await getSession();
  return !!session && session.type === "admin";
}
