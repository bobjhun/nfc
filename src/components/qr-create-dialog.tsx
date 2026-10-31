"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createQrCodeAction, type QrActionState } from "@/app/qr-codes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: QrActionState = { error: null };

export function QrCreateDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createQrCodeAction,
    initialState,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Create QR Code
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create QR Code</DialogTitle>
          <DialogDescription>
            Add a name and destination to generate a scannable QR code image.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="qr_name">Name</Label>
            <Input
              id="qr_name"
              name="qr_name"
              maxLength={255}
              placeholder="e.g. Summer Campaign"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qr_link">QR Code Link</Label>
            <Input
              id="qr_link"
              name="qr_link"
              type="url"
              maxLength={2048}
              placeholder="https://example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use a complete http:// or https:// URL.
            </p>
          </div>
          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Generating…" : "Save QR Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
