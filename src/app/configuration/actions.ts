"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveGa4Configuration } from "@/lib/ga4-config";

export interface ConfigurationActionState {
  error: string | null;
}

export async function saveGa4ConfigurationAction(
  _previousState: ConfigurationActionState,
  formData: FormData,
): Promise<ConfigurationActionState> {
  const propertyId = String(formData.get("property_id") ?? "").trim();
  const uploadedFile = formData.get("service_account_json");
  const serviceAccountFile =
    uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : undefined;

  try {
    await saveGa4Configuration(propertyId, serviceAccountFile);
  } catch (error) {
    console.error("GA4 configuration save failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "GA4 settings could not be saved. Please try again.",
    };
  }

  revalidatePath("/configuration");
  revalidatePath("/analytics");
  redirect("/configuration?saved=1");
}
