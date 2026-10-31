"use server";

import { createHash } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { saveQrImage } from "@/lib/qr";

export interface QrActionState {
  error: string | null;
}

export async function createQrCodeAction(
  _previousState: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const name = String(formData.get("qr_name") ?? "").trim();
  const link = String(formData.get("qr_link") ?? "").trim();
  if (!name || name.length > 255) {
    return { error: "Enter a name between 1 and 255 characters." };
  }
  if (link.length > 2048) {
    return { error: "The link must be 2,048 characters or fewer." };
  }
  let parsedLink: URL;
  try {
    parsedLink = new URL(link);
  } catch {
    return { error: "Enter a valid URL." };
  }
  if (!["http:", "https:"].includes(parsedLink.protocol)) {
    return { error: "The QR Code Link must use http or https." };
  }

  let generatedFile: string | null = null;
  try {
    const image = await saveQrImage(name, link);
    if (image.created) generatedFile = image.fileName;
    await db.execute(
      "INSERT INTO qr_code (qr_name, qr_link, date_added) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [name, link],
    );
  } catch (error) {
    if (generatedFile) {
      await unlink(
        path.join(process.cwd(), "public", "qr-images", generatedFile),
      ).catch(() => undefined);
    }
    console.error("QR code creation failed:", error);
    return { error: "The QR code could not be generated and saved. Try again." };
  }

  revalidatePath("/qr-codes");
  const recordKey = createHash("sha256").update(`${name}\0${link}`).digest("hex");
  redirect(`/qr-codes?created=${recordKey}`);
}
