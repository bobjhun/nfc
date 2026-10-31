"use client";

import Image from "next/image";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function QrPreviewDialog({
  name,
  link,
  imageUrl,
}: {
  name: string;
  link: string;
  imageUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const safeDownloadName =
    `${name.replace(/[^\w.-]+/g, "-") || "qr-code"}-qr-code.png`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`View QR code for ${name}`}
            className="rounded-lg p-1 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <Image
              src={imageUrl}
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-lg border bg-white p-1"
            />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            Scan this code to open its destination.
          </DialogDescription>
        </DialogHeader>
        <Image
          src={imageUrl}
          alt={`QR code for ${name}`}
          width={360}
          height={360}
          className="mx-auto size-64 rounded-xl border bg-white p-2 [image-rendering:pixelated]"
          priority
        />
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 break-all text-center text-sm text-blue-700 hover:underline"
        >
          {link}
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={<a href={imageUrl} download={safeDownloadName} />}
          >
            <Download className="size-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
