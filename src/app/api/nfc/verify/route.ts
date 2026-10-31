import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  NfcHttpError,
  asObject,
  assertSameOrigin,
  findCardById,
  handleNfcApiError,
  logNfcOperation,
  positiveId,
  readJsonBody,
  requireNfcAdmin,
  validateNfcUrl,
} from "@/lib/nfc-server";

export async function POST(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    assertSameOrigin(request);
    const body = asObject(await readJsonBody(request));
    const cardId = positiveId(body.cardId, "Card ID");
    const card = await findCardById(cardId);
    if (!card || !card.expected_ndef_url) {
      throw new NfcHttpError("NFC card or expected URL not found.", 404);
    }
    const errorMessage =
      typeof body.errorMessage === "string"
        ? body.errorMessage.trim().slice(0, 500)
        : "";
    let scannedUrl: string | null = null;
    if (typeof body.url === "string" && body.url.trim()) {
      try {
        scannedUrl = validateNfcUrl(body.url, "Scanned NFC URL");
      } catch {
        scannedUrl = null;
      }
    }
    const result = errorMessage
      ? "failure"
      : !scannedUrl
        ? "invalid"
        : scannedUrl === card.expected_ndef_url
          ? "success"
          : "mismatch";
    const message = errorMessage || (result === "invalid" ? "No supported HTTPS URL record was found." : null);
    await logNfcOperation({
      cardId,
      type: "verify",
      result,
      scannedUrl,
      expectedUrl: card.expected_ndef_url,
      errorMessage: message,
    });
    await db.execute(
      `UPDATE nfc_cards SET last_verified_at = CURRENT_TIMESTAMP,
        last_operation_result = ? WHERE id = ?`,
      [result, cardId],
    );
    return NextResponse.json({ result, expectedUrl: card.expected_ndef_url, scannedUrl, error: message });
  } catch (error) {
    return handleNfcApiError(error, "NFC verification result recording failed");
  }
}
