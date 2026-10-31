import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { validateGoogleReviewUrl } from "@/lib/nfc-server";

interface RedirectBusinessRow extends RowDataPacket {
  id: number;
  google_review_url: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }
  try {
    const [rows] = await db.execute<RedirectBusinessRow[]>(
      `SELECT id, google_review_url FROM nfc_businesses
       WHERE slug = ? AND status = 'active' LIMIT 1`,
      [slug],
    );
    const business = rows[0];
    if (!business) {
      return NextResponse.json({ error: "Business not found or inactive." }, { status: 404 });
    }
    const reviewUrl = validateGoogleReviewUrl(business.google_review_url);
    await db.execute(
      "INSERT INTO nfc_redirect_visits (business_id) VALUES (?)",
      [business.id],
    );
    return NextResponse.redirect(reviewUrl, 302);
  } catch (error) {
    console.error("Google Review redirect failed:", error);
    return NextResponse.json(
      { error: "The review destination is temporarily unavailable." },
      { status: 503 },
    );
  }
}
