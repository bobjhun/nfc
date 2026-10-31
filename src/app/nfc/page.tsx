import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeading } from "@/components/page-heading";
import { NfcManagement } from "@/components/nfc-management";
import { NfcSignIn } from "@/components/nfc-sign-in";
import { NFC_ADMIN_COOKIE, configuredAdminToken } from "@/lib/nfc-server";

export const metadata: Metadata = { title: "NFC Cards" };
export const dynamic = "force-dynamic";

export default async function NfcPage() {
  const token = configuredAdminToken();
  const jar = await cookies();
  const authenticated = Boolean(token && jar.get(NFC_ADMIN_COOKIE)?.value === token);
  return (
    <>
      <PageHeading
        title="NFC Management"
        description="Register NFC cards, program Google Review redirects, and verify card contents."
      />
      {authenticated ? <NfcManagement /> : <NfcSignIn configured={Boolean(token)} />}
    </>
  );
}
