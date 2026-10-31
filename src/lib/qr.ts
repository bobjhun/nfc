import "server-only";

import { createHash } from "node:crypto";
import { access, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

export function getQrImageFile(name: string, link: string): string {
  return `${createHash("sha256").update(`${name}\0${link}`).digest("hex")}.png`;
}

export async function saveQrImage(name: string, link: string): Promise<{
  fileName: string;
  created: boolean;
}> {
  const directory = path.join(process.cwd(), "public", "qr-images");
  await mkdir(directory, { recursive: true });
  const fileName = getQrImageFile(name, link);
  const target = path.join(directory, fileName);
  try {
    await access(target);
    return { fileName, created: false };
  } catch {
    const temporaryPath = path.join(
      directory,
      `${createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex")}.tmp`,
    );
    try {
      const image = await QRCode.toBuffer(link, {
        type: "png",
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H",
      });
      await writeFile(temporaryPath, image, { flag: "wx" });
      await rename(temporaryPath, target);
      return { fileName, created: true };
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
  }
}
