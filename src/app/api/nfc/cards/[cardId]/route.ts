import { NextResponse } from "next/server";
import { findCardById, handleNfcApiError, positiveId, requireNfcAdmin } from "@/lib/nfc-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    const { cardId: rawId } = await params;
    const cardId = positiveId(rawId, "Card ID");
    const card = await findCardById(cardId);
    if (!card) return NextResponse.json({ error: "NFC card not found." }, { status: 404 });
    return NextResponse.json({ card });
  } catch (error) {
    return handleNfcApiError(error, "NFC card lookup failed");
  }
}
