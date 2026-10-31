export type NfcSupport =
  | { supported: true }
  | { supported: false; reason: string };

const URI_PREFIXES = [
  "",
  "http://www.",
  "https://www.",
  "http://",
  "https://",
  "tel:",
  "mailto:",
  "ftp://anonymous:anonymous@",
  "ftp://ftp.",
  "ftps://",
  "sftp://",
  "smb://",
  "nfs://",
  "ftp://",
  "dav://",
  "news:",
  "telnet://",
  "imap:",
  "rtsp://",
  "urn:",
  "pop:",
  "sip:",
  "sips:",
  "tftp:",
  "btspp://",
  "btl2cap://",
  "btgoep://",
  "tcpobex://",
  "irdaobex://",
  "file://",
  "urn:epc:id:",
  "urn:epc:tag:",
  "urn:epc:pat:",
  "urn:epc:raw:",
  "urn:epc:",
  "urn:nfc:",
];

export function getNfcSupport(): NfcSupport {
  if (typeof window === "undefined") {
    return { supported: false, reason: "NFC is available only in a supported browser." };
  }
  if (!window.isSecureContext) {
    return {
      supported: false,
      reason:
        "Web NFC requires HTTPS. Local development may use http://localhost or another secure context.",
    };
  }
  if (!window.NDEFReader) {
    return {
      supported: false,
      reason:
        "Web NFC is not available in this browser. Use a compatible NFC-enabled Android phone with a supported Chrome version.",
    };
  }
  return { supported: true };
}

function decodeUrlRecord(data: DataView | null): string | null {
  if (!data || data.byteLength < 1) return null;
  const bytes = new Uint8Array(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  );
  const prefix = URI_PREFIXES[bytes[0]];
  if (prefix === undefined) return null;
  try {
    return `${prefix}${new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(1))}`;
  } catch {
    return null;
  }
}

export function extractNfcUrls(event: NDEFReadingEventLike): string[] {
  return event.message.records.flatMap((record) => {
    if (record.recordType !== "url") return [];
    const url = decodeUrlRecord(record.data);
    return url ? [url] : [];
  });
}

export function nfcErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "NFC permission was denied. Allow NFC access in the browser and try again.";
      case "NotSupportedError":
        return "This device or NFC tag does not support the requested operation.";
      case "NotReadableError":
        return "NFC is unavailable. Check that NFC is enabled and no other app is using it.";
      case "AbortError":
        return "The NFC operation was stopped.";
      case "InvalidStateError":
        return "The NFC reader is already in use. Stop the other NFC operation and try again.";
      default:
        return error.message || "The NFC operation could not be completed.";
    }
  }
  return error instanceof Error ? error.message : "The NFC operation could not be completed.";
}

export class BrowserNfcService {
  private controller: AbortController | null = null;

  async startScan(
    onUrls: (urls: string[]) => void | Promise<void>,
    onError: (message: string) => void,
  ): Promise<void> {
    const support = getNfcSupport();
    if (!support.supported) throw new Error(support.reason);
    if (this.controller) throw new Error("An NFC scan is already active.");

    const reader = new window.NDEFReader!();
    const controller = new AbortController();
    const seenMessages = new Set<string>();
    this.controller = controller;
    reader.onreading = (event) => {
      const urls = extractNfcUrls(event);
      if (urls.length === 0) {
        void Promise.resolve(onUrls([])).catch((error: unknown) =>
          onError(nfcErrorMessage(error)),
        );
        return;
      }
      const uniqueUrls = urls.filter((url) => {
        if (seenMessages.has(url)) return false;
        seenMessages.add(url);
        return true;
      });
      if (uniqueUrls.length) {
        void Promise.resolve(onUrls(uniqueUrls)).catch((error: unknown) =>
          onError(nfcErrorMessage(error)),
        );
      }
    };
    reader.onreadingerror = () =>
      onError("The tag could not be read. Hold it steady near the NFC reader.");

    try {
      await reader.scan({ signal: controller.signal });
    } catch (error) {
      this.controller = null;
      throw new Error(nfcErrorMessage(error));
    }
  }

  async writeUrl(url: string, allowOverwrite: boolean): Promise<void> {
    const support = getNfcSupport();
    if (!support.supported) throw new Error(support.reason);
    if (this.controller) throw new Error("Stop the current NFC scan before writing.");
    try {
      await new window.NDEFReader!().write(
        { records: [{ recordType: "url", data: url }] },
        { overwrite: allowOverwrite },
      );
    } catch (error) {
      throw new Error(nfcErrorMessage(error));
    }
  }

  stopScan(): void {
    this.controller?.abort();
    this.controller = null;
  }
}
