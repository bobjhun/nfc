import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import {
  NfcHttpError,
  asObject,
  assertSameOrigin,
  handleNfcApiError,
  readJsonBody,
  requiredString,
  validateGoogleReviewUrl,
  requireNfcAdmin,
} from "@/lib/nfc-server";
import type { BusinessRow } from "@/lib/nfc-server";
import { db } from "@/lib/db";

export async function GET() {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    const [rows] = await db.execute<BusinessRow[]>(
      `SELECT id, name, slug, google_review_url, status, created_at
       FROM nfc_businesses ORDER BY name`,
    );
    return NextResponse.json({ businesses: rows });
  } catch (error) {
    return handleNfcApiError(error, "NFC business list failed");
  }
}

export async function POST(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    assertSameOrigin(request);
    const body = asObject(await readJsonBody(request));
    const name = requiredString(body.name, "Business name", 160);
    const slugValue =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim().toLowerCase()
        : name
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue) || slugValue.length > 100) {
      throw new NfcHttpError(
        "Use a URL slug with lowercase letters, numbers, and single hyphens.",
        400,
      );
    }
    const googleReviewUrl = validateGoogleReviewUrl(body.googleReviewUrl);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO nfc_businesses (name, slug, google_review_url)
       VALUES (?, ?, ?)`,
      [name, slugValue, googleReviewUrl],
    );
    return NextResponse.json(
      {
        business: {
          id: result.insertId,
          name,
          slug: slugValue,
          google_review_url: googleReviewUrl,
          status: "active",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "That business slug is already in use." },
        { status: 409 },
      );
    }
    return handleNfcApiError(error, "NFC business creation failed");
  }
}
