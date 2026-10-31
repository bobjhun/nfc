import { NextResponse } from "next/server";
import {
  NFC_ADMIN_COOKIE,
  NfcHttpError,
  asObject,
  assertSameOrigin,
  configuredAdminToken,
  handleNfcApiError,
  readJsonBody,
  requiredString,
  secureTokenMatch,
} from "@/lib/nfc-server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const expected = configuredAdminToken();
    if (!expected) {
      throw new NfcHttpError(
        "NFC administration is not configured. Set NFC_ADMIN_TOKEN to a random value of at least 32 characters.",
        503,
      );
    }
    const body = asObject(await readJsonBody(request));
    const token = requiredString(body.token, "Admin token", 512);
    if (!secureTokenMatch(token, expected)) {
      throw new NfcHttpError("The administrator token is incorrect.", 401);
    }
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(NFC_ADMIN_COOKIE, expected, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return handleNfcApiError(error, "NFC administrator sign-in failed");
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(NFC_ADMIN_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleNfcApiError(error, "NFC administrator sign-out failed");
  }
}
