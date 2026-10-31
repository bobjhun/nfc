interface NDEFRecordLike {
  recordType: string;
  data: DataView | null;
}

interface NDEFMessageLike {
  records: NDEFRecordLike[];
}

interface NDEFReadingEventLike extends Event {
  message: NDEFMessageLike;
}

interface NDEFReaderLike {
  onreading: ((event: NDEFReadingEventLike) => void) | null;
  onreadingerror: (() => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(
    message: { records: { recordType: "url"; data: string }[] },
    options?: { overwrite?: boolean },
  ): Promise<void>;
}

interface Window {
  NDEFReader?: new () => NDEFReaderLike;
}
