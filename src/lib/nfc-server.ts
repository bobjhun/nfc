import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export const NFC_ADMIN_COOKIE = "nfc_admin";

export type NfcOperationType = "scan" | "write" | "verify" | "register";
export type NfcOperationResult =
  | "success"
  | "failure"
  | "mismatch"
  | "invalid";

export interface BusinessRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  google_review_url: string;
  status: "active" | "inactive";
  created_at: Date | string;
}

export interface CardRow extends RowDataPacket {
  id: number;
  business_id: number | null;
  business_name: string | null;
  business_slug: string | null;
  card_identifier: string;
  redirect_url: string | null;
  expected_ndef_url: string | null;
  status: "active" | "inactive";
  programming_status: "unprogrammed" | "registered" | "programmed" | "failed";
  last_programmed_at: Date | string | null;
  last_verified_at: Date | string | null;
  last_scanned_at: Date | string | null;
  last_operation_result: NfcOperationResult | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export class NfcHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NfcHttpError";
  }
}

export function configuredAdminToken(): string | null {
  const token = process.env.NFC_ADMIN_TOKEN;
  return token && token.length >= 32 ? token : null;
}

export function secureTokenMatch(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return (
    candidateBytes.length === expectedBytes.length &&
    timingSafeEqual(candidateBytes, expectedBytes)
  );
}

export async function isNfcAdminAuthenticated(): Promise<boolean> {
  const expected = configuredAdminToken();
  if (!expected) return false;
  const jar = await cookies();
  return secureTokenMatch(jar.get(NFC_ADMIN_COOKIE)?.value ?? "", expected);
}

export async function requireNfcAdmin(): Promise<NextResponse | null> {
  if (!configuredAdminToken()) {
    return NextResponse.json(
      { error: "NFC administration is not configured. Set NFC_ADMIN_TOKEN." },
      { status: 503 },
    );
  }
  if (!(await isNfcAdminAuthenticated())) {
    return NextResponse.json({ error: "NFC administrator sign-in required." }, {
      status: 401,
    });
  }
  return null;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new NfcHttpError("Request body must be valid JSON.", 400);
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
    if (new URL(origin).origin !== requestOrigin) {
      throw new NfcHttpError("Cross-origin NFC requests are not allowed.", 403);
    }
  } catch (error) {
    if (error instanceof NfcHttpError) throw error;
    throw new NfcHttpError("The request origin is invalid.", 403);
  }
}

export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NfcHttpError("Request body must be a JSON object.", 400);
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new NfcHttpError(`${label} is required.`, 400);
  }
  const clean = value.trim();
  if (!clean || clean.length > maxLength) {
    throw new NfcHttpError(
      `${label} must be between 1 and ${maxLength} characters.`,
      400,
    );
  }
  return clean;
}

export function positiveId(value: unknown, label = "ID"): number {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new NfcHttpError(`${label} is invalid.`, 400);
  }
  return id;
}

export function validateHttpsUrl(value: unknown, label = "URL"): string {
  const raw = requiredString(value, label, 2048);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new NfcHttpError(`${label} must be a valid HTTPS URL.`, 400);
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new NfcHttpError(`${label} must use HTTPS and contain no credentials.`, 400);
  }
  return parsed.href;
}

export function validateNfcUrl(value: unknown, label = "NFC URL"): string {
  const raw = requiredString(value, label, 2048);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new NfcHttpError(`${label} must be a valid web URL.`, 400);
  }
  const localDevelopmentHost = ["localhost", "127.0.0.1", "[::1]"].includes(
    parsed.hostname,
  );
  const secure = parsed.protocol === "https:";
  const localDevelopment =
    process.env.NODE_ENV !== "production" &&
    parsed.protocol === "http:" &&
    localDevelopmentHost;
  if (
    (!secure && !localDevelopment) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new NfcHttpError(
      `${label} must use HTTPS (localhost is allowed in development) and contain no credentials.`,
      400,
    );
  }
  return parsed.href;
}

export function validateGoogleReviewUrl(value: unknown): string {
  const url = new URL(validateHttpsUrl(value, "Google Review URL"));
  const allowed =
    (url.hostname === "g.page" && /^\/r\/[^/]+\/review\/?$/.test(url.pathname)) ||
    (url.hostname === "search.google.com" &&
      url.pathname === "/local/writereview" &&
      url.searchParams.has("placeid")) ||
    (url.hostname === "maps.app.goo.gl" && url.pathname.length > 1) ||
    ((url.hostname === "www.google.com" || url.hostname === "google.com") &&
      (/^\/maps\/(place|search)(\/|$)/.test(url.pathname) ||
        (url.pathname === "/maps" && url.searchParams.has("cid")))) ||
    (url.hostname === "maps.google.com" &&
      (url.pathname === "/" || /^\/maps\/(place|search)(\/|$)/.test(url.pathname)) &&
      (url.searchParams.has("cid") || url.pathname !== "/"));
  if (!allowed) {
    throw new NfcHttpError(
      "Use an HTTPS Google review link from g.page, Google Maps, or Google Search.",
      400,
    );
  }
  return url.href;
}

export function expectedUrlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

export function getPublicBaseUrl(requestUrl: string): string {
  const configured = process.env.NFC_PUBLIC_BASE_URL;
  const base = configured ?? new URL(requestUrl).origin;
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new NfcHttpError("NFC_PUBLIC_BASE_URL must be a valid URL.", 503);
  }
  const localDevelopmentHost = ["localhost", "127.0.0.1", "[::1]"].includes(
    parsed.hostname,
  );
  if (
    parsed.username ||
    parsed.password ||
    (parsed.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" &&
        parsed.protocol === "http:" &&
        localDevelopmentHost))
  ) {
    throw new NfcHttpError(
      "NFC_PUBLIC_BASE_URL must use HTTPS (localhost is allowed in development).",
      503,
    );
  }
  if (!configured && process.env.NODE_ENV === "production") {
    throw new NfcHttpError(
      "Set NFC_PUBLIC_BASE_URL to the public HTTPS origin before assigning cards.",
      503,
    );
  }
  return parsed.origin;
}

export function createRedirectUrl(requestUrl: string, slug: string): string {
  return `${getPublicBaseUrl(requestUrl)}/r/${encodeURIComponent(slug)}`;
}

export async function findCardById(id: number): Promise<CardRow | undefined> {
  const [rows] = await db.execute<CardRow[]>(
    `SELECT c.*, b.name AS business_name, b.slug AS business_slug
     FROM nfc_cards c
     LEFT JOIN nfc_businesses b ON b.id = c.business_id
     WHERE c.id = ? LIMIT 1`,
    [id],
  );
  return rows[0];
}

export async function logNfcOperation(input: {
  cardId: number | null;
  type: NfcOperationType;
  result: NfcOperationResult;
  scannedUrl?: string | null;
  expectedUrl?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  await db.execute(
    `INSERT INTO nfc_operations
      (card_id, operation_type, result, scanned_url, expected_url, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.cardId,
      input.type,
      input.result,
      input.scannedUrl ?? null,
      input.expectedUrl ?? null,
      input.errorMessage?.slice(0, 500) ?? null,
    ],
  );
}

export function handleNfcApiError(error: unknown, context: string): NextResponse {
  if (error instanceof NfcHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`${context}:`, error);
  return NextResponse.json(
    { error: "The NFC request could not be completed. Try again." },
    { status: 500 },
  );
}
