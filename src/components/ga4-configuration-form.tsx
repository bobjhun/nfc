"use client";

import { useActionState } from "react";
import { CheckCircle2, CircleAlert, UploadCloud } from "lucide-react";
import {
  saveGa4ConfigurationAction,
  type ConfigurationActionState,
} from "@/app/configuration/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ConfigurationActionState = { error: null };

export function Ga4ConfigurationForm({
  propertyId,
  serviceAccountEmail,
  isConnected,
}: {
  propertyId: string;
  serviceAccountEmail: string;
  isConnected: boolean;
}) {
  const [state, action, pending] = useActionState(
    saveGa4ConfigurationAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-6 p-5 sm:p-7">
      <div className="space-y-2">
        <Label htmlFor="property_id">GA4 Property ID</Label>
        <Input
          id="property_id"
          name="property_id"
          inputMode="numeric"
          pattern="[0-9]{1,32}"
          defaultValue={propertyId}
          placeholder="e.g. 123456789"
          required
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Find it in Google Analytics under Admin → Property details. This is
          the numeric Property ID, not the Measurement ID (G-...).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service_account_json">Service-account JSON key</Label>
        <Input
          id="service_account_json"
          name="service_account_json"
          type="file"
          accept=".json,application/json"
          required={!isConnected}
          className="h-auto min-h-11 cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isConnected
            ? `Connected service account: ${serviceAccountEmail}. Leave empty to keep its current key.`
            : "Upload a JSON key for a Google Cloud service account with GA4 Viewer access."}
        </p>
      </div>
      {state.error && (
        <div role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <UploadCloud className="size-4" />
          {pending ? "Saving…" : "Save Google Analytics Settings"}
        </Button>
      </div>
    </form>
  );
}

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
        connected ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {connected ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {connected ? "Credentials added" : "Not connected"}
    </span>
  );
}
