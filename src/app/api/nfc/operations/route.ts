import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { handleNfcApiError, positiveId, requireNfcAdmin } from "@/lib/nfc-server";

interface OperationRow extends RowDataPacket {
  id: number;
  card_id: number | null;
  card_identifier: string | null;
  business_name: string | null;
  operation_type: "scan" | "write" | "verify" | "register";
  result: "success" | "failure" | "mismatch" | "invalid";
  scanned_url: string | null;
  expected_url: string | null;
  error_message: string | null;
  created_at: Date | string;
}

export async function GET(request: Request) {
  const denied = await requireNfcAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const cardIdParam = searchParams.get("cardId");
    const cardId = cardIdParam ? positiveId(cardIdParam, "Card ID") : null;
    const parsedLimit = Number(searchParams.get("limit") ?? 30);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(100, Math.max(1, parsedLimit))
      : 30;
    const where = cardId ? "WHERE o.card_id = ?" : "";
    const values: (number | string)[] = cardId ? [cardId, limit] : [limit];
    const [rows] = await db.execute<OperationRow[]>(
      `SELECT o.id, o.card_id, c.card_identifier, b.name AS business_name,
        o.operation_type, o.result, o.scanned_url, o.expected_url,
        o.error_message, o.created_at
       FROM nfc_operations o
       LEFT JOIN nfc_cards c ON c.id = o.card_id
       LEFT JOIN nfc_businesses b ON b.id = c.business_id
       ${where}
       ORDER BY o.id DESC LIMIT ?`,
      values,
    );
    return NextResponse.json({ operations: rows });
  } catch (error) {
    return handleNfcApiError(error, "NFC operation history lookup failed");
  }
}
