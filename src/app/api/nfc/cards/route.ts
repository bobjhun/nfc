import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
  validateNfcUrl,
} from "@/lib/nfc-server";
import type { BusinessRow, CardRow } from "@/lib/nfc-server";

interface CardCountsRow extends RowDataPacket {
  total_cards: number;
  active_cards: number;
  unassigned_cards: number;
  programmed_cards: number;
}

export async function GET() {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    const [rows] = await db.execute<CardRow[]>(
      `SELECT c.id, c.business_id, b.name AS business_name, b.slug AS business_slug,
        c.card_identifier, c.redirect_url, c.expected_ndef_url, c.status,
        c.programming_status, c.last_programmed_at, c.last_verified_at,
        c.last_scanned_at,
        (SELECT o.result FROM nfc_operations o WHERE o.card_id = c.id
         ORDER BY o.id DESC LIMIT 1) AS last_operation_result,
        c.created_at, c.updated_at
       FROM nfc_cards c
       LEFT JOIN nfc_businesses b ON b.id = c.business_id
       ORDER BY c.updated_at DESC, c.id DESC`,
    );
    const [counts] = await db.execute<CardCountsRow[]>(
      `SELECT COUNT(*) AS total_cards,
        SUM(status = 'active') AS active_cards,
        SUM(business_id IS NULL) AS unassigned_cards,
        SUM(programming_status = 'programmed') AS programmed_cards
       FROM nfc_cards`,
    );
    return NextResponse.json({ cards: rows, stats: counts[0] });
  } catch (error) {
    return handleNfcApiError(error, "NFC card list failed");
  }
}

export async function POST(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  const connection = await db.getConnection();
  let transactionStarted = false;
  try {
    assertSameOrigin(request);
    const body = asObject(await readJsonBody(request));
    const hasUrl = body.scannedUrl !== undefined;
    const hasBusiness = body.businessId !== undefined;
    if (hasUrl === hasBusiness) {
      throw new NfcHttpError(
        "Register an unrecognized scanned URL or create an unprogrammed card for a business.",
        400,
      );
    }

    let businessId: number | null = null;
    let redirectUrl: string | null = null;
    let expectedUrl: string;
    let programmingStatus: "registered" | "unprogrammed";
    if (hasUrl) {
      expectedUrl = validateNfcUrl(body.scannedUrl, "Scanned NFC URL");
      programmingStatus = "registered";
    } else {
      businessId = positiveId(body.businessId, "Business ID");
      const [businesses] = await connection.execute<BusinessRow[]>(
        `SELECT id, name, slug, google_review_url, status, created_at
         FROM nfc_businesses WHERE id = ? AND status = 'active' LIMIT 1`,
        [businessId],
      );
      const business = businesses[0];
      if (!business) throw new NfcHttpError("Active business not found.", 404);
      redirectUrl = createRedirectUrl(request.url, business.slug);
      expectedUrl = redirectUrl;
      programmingStatus = "unprogrammed";
    }
    const urlHash = expectedUrlHash(expectedUrl);
    const cardIdentifier = randomBytes(16).toString("hex");
    await connection.beginTransaction();
    transactionStarted = true;
    const [insert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO nfc_cards
        (business_id, card_identifier, redirect_url, expected_ndef_url,
         expected_url_hash, programming_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        businessId,
        cardIdentifier,
        redirectUrl,
        expectedUrl,
        urlHash,
        programmingStatus,
      ],
    );
    const cardId = insert.insertId;
    await connection.execute(
      `INSERT INTO nfc_operations
        (card_id, operation_type, result, scanned_url, expected_url)
       VALUES (?, 'register', 'success', ?, ?)`,
      [cardId, hasUrl ? expectedUrl : null, expectedUrl],
    );
    await connection.commit();
    transactionStarted = false;
    const [cards] = await db.execute<CardRow[]>(
      `SELECT c.*, b.name AS business_name, b.slug AS business_slug
       FROM nfc_cards c LEFT JOIN nfc_businesses b ON b.id = c.business_id
       WHERE c.id = ?`,
      [cardId],
    );
    return NextResponse.json({ card: cards[0] }, { status: 201 });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "A card is already registered with this NFC URL." },
        { status: 409 },
      );
    }
    return handleNfcApiError(error, "NFC card registration failed");
  } finally {
    connection.release();
  }
}
