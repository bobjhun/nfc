import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import {
  NfcHttpError,
  asObject,
  assertSameOrigin,
  createRedirectUrl,
  expectedUrlHash,
  handleNfcApiError,
  positiveId,
  readJsonBody,
  requireNfcAdmin,
} from "@/lib/nfc-server";
import type { BusinessRow, CardRow } from "@/lib/nfc-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    assertSameOrigin(request);
    const { cardId: rawId } = await params;
    const cardId = positiveId(rawId, "Card ID");
    const body = asObject(await readJsonBody(request));
    const businessId =
      body.businessId === null ? null : positiveId(body.businessId, "Business ID");
    let redirectUrl: string | null = null;
    let expectedUrl: string | null = null;
    let urlHash: string | null = null;
    if (businessId !== null) {
      const [businesses] = await db.execute<BusinessRow[]>(
        `SELECT id, name, slug, google_review_url, status, created_at
         FROM nfc_businesses WHERE id = ? AND status = 'active' LIMIT 1`,
        [businessId],
      );
      const business = businesses[0];
      if (!business) throw new NfcHttpError("Active business not found.", 404);
      redirectUrl = createRedirectUrl(request.url, business.slug);
      expectedUrl = redirectUrl;
      urlHash = expectedUrlHash(expectedUrl);
    }
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE nfc_cards SET
        programming_status = IF(expected_ndef_url <=> ?, programming_status, 'unprogrammed'),
        business_id = ?, redirect_url = ?,
        expected_ndef_url = ?, expected_url_hash = ?
       WHERE id = ?`,
      [expectedUrl, businessId, redirectUrl, expectedUrl, urlHash, cardId],
    );
    if (result.affectedRows === 0) {
      const [rows] = await db.execute<CardRow[]>(
        "SELECT id FROM nfc_cards WHERE id = ? LIMIT 1",
        [cardId],
      );
      if (!rows[0]) throw new NfcHttpError("NFC card not found.", 404);
    }
    return NextResponse.json({ assigned: businessId !== null });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "That redirect URL is already assigned to another card." },
        { status: 409 },
      );
    }
    return handleNfcApiError(error, "NFC card assignment failed");
  }
}
