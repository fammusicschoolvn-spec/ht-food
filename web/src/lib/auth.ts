import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const COOKIE = "ht_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function authConfigured(): boolean {
  return Boolean(secret() && process.env.ADMIN_PASSWORD);
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("hex");
}

function sameString(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  const key = secret();
  if (!expected || !key) return false;
  // So sánh hai chữ ký cùng độ dài để không lộ độ dài mật khẩu.
  return sameString(sign(input, key), sign(expected, key));
}

export async function startSession(): Promise<void> {
  const key = secret();
  if (!key) throw new Error("Chưa cấu hình SESSION_SECRET");
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const key = secret();
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!key || !raw) return false;
  const [exp, mac] = raw.split(".");
  if (!exp || !mac || !sameString(mac, sign(exp, key))) return false;
  // Giờ hiện tại chỉ có nghĩa lúc có yêu cầu thật, không tính lúc dựng sẵn trang.
  await connection();
  return Number(exp) > Date.now();
}

/** Gọi ở đầu mọi trang và mọi thao tác quản trị. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/dang-nhap");
}

// Chặn dò mật khẩu: 5 lần sai trong 10 phút thì khóa 10 phút.
const WINDOW = 10 * 60 * 1000;
let fails: number[] = [];

export function loginLocked(): boolean {
  const now = Date.now();
  fails = fails.filter((t) => now - t < WINDOW);
  return fails.length >= 5;
}

export function recordFail(): void {
  fails.push(Date.now());
}

export function clearFails(): void {
  fails = [];
}
