import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import {
  NfcHttpError,
  asObject,
  assertSameOrigin,
  expectedUrlHash,
  handleNfcApiError,
  logNfcOperation,
  readJsonBody,
  requireNfcAdmin,
  validateNfcUrl,
} from "@/lib/nfc-server";

interface ScanMatchRow extends RowDataPacket {
  id: number;
  card_identifier: string;
  business_id: number | null;
  business_name: string | null;
  expected_ndef_url: string;
  programming_status: string;
  status: string;
}

export async function POST(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    assertSameOrigin(request);
    const body = asObject(await readJsonBody(request));
    const errorMessage =
      typeof body.errorMessage === "string"
        ? body.errorMessage.trim().slice(0, 500)
        : "";
    if (errorMessage) {
      await logNfcOperation({
        cardId: null,
        type: "scan",
        result: "failure",
        errorMessage,
      });
      return NextResponse.json({ matched: false, error: errorMessage });
    }
    let scannedUrl: string;
    try {
      scannedUrl = validateNfcUrl(body.url, "Scanned NFC URL");
    } catch (error) {
      const message =
        error instanceof NfcHttpError ? error.message : "The scanned URL is invalid.";
      await logNfcOperation({
        cardId: null,
        type: "scan",
        result: "invalid",
        errorMessage: message,
      });
      return NextResponse.json({ matched: false, error: message }, { status: 200 });
    }

    const [matches] = await db.execute<ScanMatchRow[]>(
      `SELECT c.*, b.name AS business_name, b.slug AS business_slug
       FROM nfc_cards c
       LEFT JOIN nfc_businesses b ON b.id = c.business_id
       WHERE c.expected_url_hash = ? AND c.expected_ndef_url = ?
       ORDER BY c.id`,
      [expectedUrlHash(scannedUrl), scannedUrl],
    );
    const cardId = matches.length === 1 ? matches[0].id : null;
    await logNfcOperation({
      cardId,
      type: "scan",
      result: "success",
      scannedUrl,
      expectedUrl: matches.length === 1 ? matches[0].expected_ndef_url : null,
    });
    if (cardId !== null) {
      await db.execute(
        "UPDATE nfc_cards SET last_scanned_at = CURRENT_TIMESTAMP, last_operation_result = 'success' WHERE id = ?",
        [cardId],
      );
    }
    return NextResponse.json({
      matched: matches.length > 0,
      ambiguous: matches.length > 1,
      cards: matches,
      scannedUrl,
    });
  } catch (error) {
    return handleNfcApiError(error, "NFC scan result recording failed");
  }
}
