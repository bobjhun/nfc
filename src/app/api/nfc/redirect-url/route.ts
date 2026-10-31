import { NextResponse } from "next/server";
import {
  NfcHttpError,
  createRedirectUrl,
  handleNfcApiError,
  positiveId,
  requireNfcAdmin,
} from "@/lib/nfc-server";
import type { BusinessRow } from "@/lib/nfc-server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const businessId = positiveId(searchParams.get("businessId"), "Business ID");
    const [rows] = await db.execute<BusinessRow[]>(
      `SELECT id, name, slug, google_review_url, status, created_at
       FROM nfc_businesses WHERE id = ? AND status = 'active' LIMIT 1`,
      [businessId],
    );
    if (!rows[0]) throw new NfcHttpError("Active business not found.", 404);
    return NextResponse.json({
      url: createRedirectUrl(request.url, rows[0].slug),
      businessName: rows[0].name,
    });
  } catch (error) {
    return handleNfcApiError(error, "NFC redirect URL generation failed");
  }
}
