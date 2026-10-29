import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@prisma/client";

const COOKIE_NAME = "mandihisab_session";
const SESSION_DAYS = 14;

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(message = "You must be signed in to do this") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  const store = await cookies();
  store.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

/** Reads the session cookie and returns the signed-in user, or null. Expired/orphaned sessions are cleaned up lazily. Safe to call from Server Components (read-only) and Server Actions. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session) return null;

  if (session.expiresAt < new Date() || !session.user.isActive) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  return { id: session.user.id, name: session.user.name, role: session.user.role };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
  }
  store.delete(COOKIE_NAME);
}

/** For Server Components/pages: redirects to /login if nobody is signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For Server Actions: throws instead of redirecting, so the action's try/catch turns it into an ActionResult error. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== role) throw new ForbiddenError(`Only ${role === "OWNER" ? "the Owner" : role} can do this`);
  return user;
}
