import type { Metadata } from "next";
import { access } from "node:fs/promises";
import path from "node:path";
import { Check, Cloud, KeyRound, ShieldCheck } from "lucide-react";
import { ConnectionBadge, Ga4ConfigurationForm } from "@/components/ga4-configuration-form";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ga4CredentialDirectory,
  getGa4Configuration,
} from "@/lib/ga4-config";

export const metadata: Metadata = { title: "Configuration" };
export const dynamic = "force-dynamic";

export default async function ConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  let configuration = null;
  let databaseError = "";
  try {
    configuration = await getGa4Configuration();
  } catch (error) {
    console.error("Could not load GA4 configuration:", error);
    databaseError = "The database is unavailable. Start MySQL and try again.";
  }

  let credentialsExist = false;
  if (configuration) {
    try {
      await access(
        path.join(
          ga4CredentialDirectory(),
          path.basename(configuration.credentialFile),
        ),
      );
      credentialsExist = true;
    } catch {
      credentialsExist = false;
    }
  }

  return (
    <>
      <PageHeading
        title="Configuration"
        description="Connect your Google Analytics 4 property to view its reports."
      />
      <Card className="max-w-4xl gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Cloud className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Google Analytics 4</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Connect a GA4 property to load reports in Analytics.
              </p>
            </div>
          </div>
          <ConnectionBadge connected={credentialsExist} />
        </CardHeader>
        <CardContent className="p-0">
          {databaseError && (
            <p role="alert" className="mx-5 mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800 sm:mx-7">
              {databaseError}
            </p>
          )}
          {params.saved && (
            <p role="status" className="mx-5 mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800 sm:mx-7">
              Google Analytics configuration saved.
            </p>
          )}
          <Ga4ConfigurationForm
            propertyId={configuration?.propertyId ?? ""}
            serviceAccountEmail={configuration?.serviceAccountEmail ?? ""}
            isConnected={credentialsExist}
          />
          <div className="border-t bg-slate-50/80 px-5 py-5 sm:px-7">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f1c33]">
              <KeyRound className="size-4 text-blue-700" />
              Setup checklist
            </h2>
            <ol className="mt-3 grid gap-2.5 text-xs leading-relaxed text-slate-600">
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-green-600" />Enable the Google Analytics Data API in your Google Cloud project.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-green-600" />Create a service account and download its JSON key.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-green-600" />Enter the numeric GA4 Property ID, upload its JSON key, then save.</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-green-600" />Add the displayed service-account email as a Viewer on the GA4 property.</li>
            </ol>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-400" />
              The key is stored outside the project/public folder and is never
              stored in the database. Do not share it or commit it to source
              control.
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className="size-2 rounded-full bg-slate-300" />
        Connected to MySQL database: {process.env.DB_NAME ?? "social_media"}
      </p>
    </>
  );
}
