import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export interface Ga4Configuration {
  propertyId: string;
  serviceAccountEmail: string;
  credentialFile: string;
}

interface Ga4ConfigurationRow extends RowDataPacket {
  property_id: string;
  service_account_email: string;
  credential_file: string;
}

export function ga4CredentialDirectory(): string {
  return path.resolve(/*turbopackIgnore: true*/
    process.env.GA4_CREDENTIAL_DIR ??
      path.join(process.cwd(), "..", "..", "social-media-private"),
  );
}

export async function getGa4Configuration(): Promise<Ga4Configuration | null> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ga4_configuration (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      property_id VARCHAR(32) NOT NULL,
      service_account_email VARCHAR(255) NOT NULL,
      credential_file VARCHAR(80) NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [rows] = await db.execute<Ga4ConfigurationRow[]>(
    "SELECT property_id, service_account_email, credential_file FROM ga4_configuration WHERE id = 1",
  );
  const row = rows[0];
  return row
    ? {
        propertyId: row.property_id,
        serviceAccountEmail: row.service_account_email,
        credentialFile: path.basename(row.credential_file),
      }
    : null;
}

export async function saveGa4Configuration(
  propertyId: string,
  serviceAccountFile?: File,
): Promise<void> {
  const existing = await getGa4Configuration();
  if (!/^\d{1,32}$/.test(propertyId)) {
    throw new Error("Enter the numeric GA4 Property ID, not the Measurement ID.");
  }

  let credentialFile = existing?.credentialFile;
  let serviceAccountEmail = existing?.serviceAccountEmail;
  let newCredentialPath: string | undefined;

  if (serviceAccountFile && serviceAccountFile.size > 0) {
    if (serviceAccountFile.size > 1_048_576) {
      throw new Error("The service-account JSON file must be 1 MB or smaller.");
    }
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(await serviceAccountFile.text()) as Record<
        string,
        unknown
      >;
    } catch {
      throw new Error("The uploaded file is not valid JSON.");
    }
    if (
      credentials.type !== "service_account" ||
      typeof credentials.client_email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.client_email) ||
      typeof credentials.private_key !== "string" ||
      !credentials.private_key.includes("-----BEGIN PRIVATE KEY-----") ||
      typeof credentials.project_id !== "string"
    ) {
      throw new Error("Upload a valid Google service-account JSON key file.");
    }

    const directory = ga4CredentialDirectory();
    const relativePath = path.relative(process.cwd(), directory);
    if (
      relativePath === "" ||
      (!relativePath.startsWith(`..${path.sep}`) &&
        relativePath !== ".." &&
        !path.isAbsolute(relativePath))
    ) {
      throw new Error(
        "GA4_CREDENTIAL_DIR must point outside the project and public web root.",
      );
    }
    await mkdir(directory, { recursive: true, mode: 0o700 });
    credentialFile = `${randomUUID()}.json`;
    newCredentialPath = path.join(/*turbopackIgnore: true*/ directory, credentialFile);
    const temporaryPath = path.join(directory, `${randomUUID()}.tmp`);
    try {
      await writeFile(temporaryPath, JSON.stringify(credentials), {
        flag: "wx",
        mode: 0o600,
      });
      await rename(temporaryPath, newCredentialPath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      throw error;
    }
    serviceAccountEmail = credentials.client_email;
  }

  if (!credentialFile || !serviceAccountEmail) {
    throw new Error("Upload a service-account JSON key to connect this property.");
  }

  try {
    await db.execute(
      `INSERT INTO ga4_configuration (id, property_id, service_account_email, credential_file)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE property_id = VALUES(property_id),
         service_account_email = VALUES(service_account_email),
         credential_file = VALUES(credential_file)`,
      [propertyId, serviceAccountEmail, credentialFile],
    );
  } catch (error) {
    if (newCredentialPath) await unlink(newCredentialPath).catch(() => undefined);
    throw error;
  }

  if (
    newCredentialPath &&
    existing?.credentialFile &&
    existing.credentialFile !== credentialFile
  ) {
    await unlink(
      path.join(
        /*turbopackIgnore: true*/
        ga4CredentialDirectory(),
        path.basename(existing.credentialFile),
      ),
    ).catch(() => undefined);
  }
}

export async function readGa4Credentials(
  credentialFile: string,
): Promise<Record<string, unknown>> {
  const filePath = path.join(/*turbopackIgnore: true*/
    ga4CredentialDirectory(),
    path.basename(credentialFile),
  );
  const credentials = JSON.parse(
    await readFile(/*turbopackIgnore: true*/ filePath, "utf8"),
  ) as Record<
    string,
    unknown
  >;
  if (credentials.type !== "service_account") {
    throw new Error("The stored Google service-account key is invalid.");
  }
  return credentials;
}
