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
    if (!card || card.status !== "active") {
      throw new NfcHttpError("Active NFC card not found.", 404);
    }
    const result = body.result;
    if (result !== "success" && result !== "failure") {
      throw new NfcHttpError("Write result must be success or failure.", 400);
    }
    const url =
      typeof body.url === "string"
        ? validateNfcUrl(body.url, "Written NFC URL")
        : "";
    const errorMessage =
      typeof body.errorMessage === "string"
        ? body.errorMessage.trim().slice(0, 500)
        : null;
    if (result === "success" && url !== card.expected_ndef_url) {
      throw new NfcHttpError(
        "The reported written URL does not match this card's assigned URL.",
        409,
      );
    }
    if (result === "failure" && !errorMessage) {
      throw new NfcHttpError("Include the NFC write failure reason.", 400);
    }
    await logNfcOperation({
      cardId,
      type: "write",
      result,
      scannedUrl: url || null,
      expectedUrl: card.expected_ndef_url,
      errorMessage,
    });
    await db.execute(
      `UPDATE nfc_cards SET programming_status = ?,
        last_programmed_at = CASE WHEN ? = 'success' THEN CURRENT_TIMESTAMP ELSE last_programmed_at END,
        last_operation_result = ?
       WHERE id = ?`,
      [result === "success" ? "programmed" : "failed", result, result, cardId],
    );
    return NextResponse.json({ result });
  } catch (error) {
    return handleNfcApiError(error, "NFC write result recording failed");
  }
}
