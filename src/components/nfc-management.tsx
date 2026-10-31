"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Clock3,
  CreditCard,
  LoaderCircle,
  LogOut,
  Nfc,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  SmartphoneNfc,
  UserRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BrowserNfcService, getNfcSupport } from "@/lib/nfc-client";

interface NfcBusiness {
  id: number;
  name: string;
  slug: string;
  google_review_url: string;
  status: "active" | "inactive";
}

interface NfcCard {
  id: number;
  business_id: number | null;
  business_name: string | null;
  business_slug: string | null;
  card_identifier: string;
  redirect_url: string | null;
  expected_ndef_url: string | null;
  status: "active" | "inactive";
  programming_status: "unprogrammed" | "registered" | "programmed" | "failed";
  last_programmed_at: string | null;
  last_verified_at: string | null;
  last_scanned_at: string | null;
  last_operation_result: "success" | "failure" | "mismatch" | "invalid" | null;
  created_at: string;
}

interface NfcOperation {
  id: number;
  card_id: number | null;
  card_identifier: string | null;
  business_name: string | null;
  operation_type: "scan" | "write" | "verify" | "register";
  result: "success" | "failure" | "mismatch" | "invalid";
  scanned_url: string | null;
  expected_url: string | null;
  error_message: string | null;
  created_at: string;
}

interface ApiError {
  error?: string;
}

type ModalState =
  | { type: "business" }
  | { type: "create-card" }
  | { type: "view"; card: NfcCard }
  | { type: "assign"; card: NfcCard }
  | { type: "write"; card: NfcCard }
  | { type: "verify"; card: NfcCard }
  | null;

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = (await response.json()) as T & ApiError;
  if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status}).`);
  return result;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Unknown"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    programmed: "bg-green-50 text-green-700",
    success: "bg-green-50 text-green-700",
    unprogrammed: "bg-amber-50 text-amber-800",
    registered: "bg-blue-50 text-blue-700",
    failure: "bg-red-50 text-red-700",
    failed: "bg-red-50 text-red-700",
    mismatch: "bg-orange-50 text-orange-800",
    invalid: "bg-slate-100 text-slate-700",
    inactive: "bg-slate-100 text-slate-600",
    scan: "bg-blue-50 text-blue-700",
    write: "bg-violet-50 text-violet-700",
    verify: "bg-cyan-50 text-cyan-800",
    register: "bg-slate-100 text-slate-700",
  };
  return (
    <Badge variant="secondary" className={styles[value] ?? "bg-slate-100 text-slate-700"}>
      {value.replaceAll("_", " ")}
    </Badge>
  );
}

export function NfcManagement() {
  const service = useRef(new BrowserNfcService());
  const supportSnapshot = useSyncExternalStore(
    () => () => {},
    () => {
      const current = getNfcSupport();
      return current.supported ? "supported" : `unsupported:${current.reason}`;
    },
    () => "checking",
  );
  const support = supportSnapshot === "supported"
    ? { supported: true }
    : {
        supported: false,
        reason: supportSnapshot.startsWith("unsupported:")
          ? supportSnapshot.slice("unsupported:".length)
          : "Checking browser NFC support...",
      };
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [businesses, setBusinesses] = useState<NfcBusiness[]>([]);
  const [operations, setOperations] = useState<NfcOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [scanActive, setScanActive] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [unknownUrl, setUnknownUrl] = useState("");
  const [matches, setMatches] = useState<NfcCard[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [newCardBusinessId, setNewCardBusinessId] = useState("");
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [operationMessage, setOperationMessage] = useState("");

  const refresh = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [cardData, businessData, operationData] = await Promise.all([
        apiRequest<{ cards: NfcCard[] }>("/api/nfc/cards"),
        apiRequest<{ businesses: NfcBusiness[] }>("/api/nfc/businesses"),
        apiRequest<{ operations: NfcOperation[] }>("/api/nfc/operations?limit=8"),
      ]);
      setCards(cardData.cards);
      setBusinesses(businessData.businesses);
      setOperations(operationData.operations);
      setError("");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "NFC data could not be loaded.";
      setError(message);
      if (message.includes("administrator sign-in")) {
        await fetch("/api/nfc/auth", { method: "DELETE" });
        window.location.reload();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const currentService = service.current;
    const timer = window.setTimeout(() => void refresh(false), 0);
    return () => {
      window.clearTimeout(timer);
      currentService.stopScan();
    };
  }, [refresh]);

  const filteredCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesQuery =
        !term ||
        [
          card.business_name,
          card.card_identifier,
          card.expected_ndef_url,
          card.redirect_url,
        ].some((value) => value?.toLowerCase().includes(term));
      const matchesFilter =
        filter === "all" ||
        (filter === "unassigned" && !card.business_id) ||
        card.programming_status === filter ||
        card.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [cards, filter, query]);

  const activeBusinesses = businesses.filter((business) => business.status === "active");

  async function refreshAfter(message?: string) {
    if (message) setNotice(message);
    setModal(null);
    await refresh(false);
  }

  async function signOut() {
    service.current.stopScan();
    await fetch("/api/nfc/auth", { method: "DELETE" });
    window.location.reload();
  }

  async function submitBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiRequest("/api/nfc/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: businessName,
          slug: businessSlug,
          googleReviewUrl: reviewUrl,
        }),
      });
      setBusinessName("");
      setBusinessSlug("");
      setReviewUrl("");
      await refreshAfter("Business created. Create or assign a card to program its review redirect.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Business creation failed.");
    } finally {
      setPending(false);
    }
  }

  async function submitNewCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiRequest("/api/nfc/cards", {
        method: "POST",
        body: JSON.stringify({ businessId: Number(newCardBusinessId) }),
      });
      setNewCardBusinessId("");
      await refreshAfter("NFC card registered. Write its generated redirect URL to the physical tag.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Card registration failed.");
    } finally {
      setPending(false);
    }
  }

  async function submitAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "assign") return;
    setPending(true);
    setError("");
    try {
      await apiRequest(`/api/nfc/cards/${modal.card.id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          businessId: assignBusinessId ? Number(assignBusinessId) : null,
        }),
      });
      await refreshAfter("Card assignment updated. Program the card again to match its new redirect URL.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Card assignment failed.");
    } finally {
      setPending(false);
    }
  }

  async function reportScanError(message: string) {
    setScanResult(message);
    try {
      await apiRequest("/api/nfc/scan", {
        method: "POST",
        body: JSON.stringify({ errorMessage: message }),
      });
      await refresh(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : message);
    }
  }

  async function startScan() {
    if (!support.supported) {
      setError(support.reason ?? "Web NFC is not available in this browser.");
      return;
    }
    setError("");
    setNotice("");
    setScanResult("Hold an NFC card near the back of your phone. Scanning stays active until you stop it.");
    setUnknownUrl("");
    setMatches([]);
    setScanActive(true);
    try {
      await service.current.startScan(
        async (urls) => {
          if (urls.length === 0) {
            await reportScanError("The tag has no supported URL record.");
            return;
          }
          const outcomes = await Promise.all(
            urls.map(async (url) => {
              const response = await apiRequest<{
                matched: boolean;
                ambiguous: boolean;
                cards: NfcCard[];
                scannedUrl: string;
                error?: string;
              }>("/api/nfc/scan", {
                method: "POST",
                body: JSON.stringify({ url }),
              });
              return response;
            }),
          );
          const result = outcomes[0];
          if (!result.matched) {
            setUnknownUrl(result.scannedUrl);
            setMatches([]);
            setScanResult(`Unregistered NFC card. URL: ${result.scannedUrl}`);
          } else if (result.ambiguous) {
            setMatches(result.cards);
            setScanResult("This URL is assigned to multiple cards. Choose the matching internal card below.");
          } else {
            setMatches(result.cards);
            setScanResult(`Matched ${result.cards[0]?.business_name ?? "unassigned card"} · ${result.cards[0]?.card_identifier}`);
          }
          await refresh(false);
        },
        (message) => void reportScanError(message),
      );
    } catch (reason) {
      setScanActive(false);
      setError(reason instanceof Error ? reason.message : "NFC scanning failed.");
    }
  }

  function stopScan() {
    service.current.stopScan();
    setScanActive(false);
    setScanResult("Scanning stopped.");
  }

  async function registerScannedCard() {
    if (!unknownUrl) return;
    setPending(true);
    setError("");
    try {
      await apiRequest("/api/nfc/cards", {
        method: "POST",
        body: JSON.stringify({ scannedUrl: unknownUrl }),
      });
      setUnknownUrl("");
      setScanResult("Unassigned NFC card registered. Assign a business and rewrite it to use a review redirect.");
      await refresh(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration failed.");
    } finally {
      setPending(false);
    }
  }

  async function writeCard(card: NfcCard) {
    if (!card.expected_ndef_url) {
      setError("This card needs an active business assignment before it can be written.");
      return;
    }
    if (!support.supported) {
      setError(support.reason ?? "Web NFC is unavailable.");
      return;
    }
    if (!window.confirm(
      overwrite
        ? "This allows the NFC tag's current contents to be overwritten. Continue?"
        : "Hold a blank NFC card near the phone. A non-blank tag will not be overwritten. Continue?",
    )) return;

    setPending(true);
    setOperationMessage("Waiting for an NFC tag. Keep the phone and card together until the browser reports completion.");
    setError("");
    try {
      await service.current.writeUrl(card.expected_ndef_url, overwrite);
      try {
        await apiRequest("/api/nfc/write", {
          method: "POST",
          body: JSON.stringify({
            cardId: card.id,
            url: card.expected_ndef_url,
            result: "success",
          }),
        });
        setOperationMessage("The browser reported a successful write and the operation was saved.");
      } catch (reason) {
        setOperationMessage(
          `The browser reported a successful write, but its result could not be saved: ${reason instanceof Error ? reason.message : "server error"}`,
        );
      }
      await refresh(false);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The NFC write failed.";
      try {
        await apiRequest("/api/nfc/write", {
          method: "POST",
          body: JSON.stringify({
            cardId: card.id,
            url: card.expected_ndef_url,
            result: "failure",
            errorMessage: message,
          }),
        });
      } catch (logError) {
        setError(`${message} The failure could not be saved: ${logError instanceof Error ? logError.message : "server error"}`);
      }
      setOperationMessage(message);
      await refresh(false);
    } finally {
      setPending(false);
    }
  }

  async function startVerification(card: NfcCard) {
    if (!support.supported) {
      setError(support.reason ?? "Web NFC is unavailable.");
      return;
    }
    setError("");
    setOperationMessage("Hold the selected NFC card near the phone to compare its URL.");
    setPending(false);
    setScanActive(true);
    try {
      await service.current.startScan(
        async (urls) => {
          service.current.stopScan();
          setScanActive(false);
          try {
            const result = await apiRequest<{
              result: string;
              expectedUrl: string;
              scannedUrl: string | null;
              error: string | null;
            }>("/api/nfc/verify", {
              method: "POST",
              body: JSON.stringify({ cardId: card.id, url: urls[0] }),
            });
            const messages: Record<string, string> = {
              success: "Verified: the card URL matches the expected URL.",
              mismatch: `Mismatch: scanned ${result.scannedUrl}; expected ${result.expectedUrl}.`,
              invalid: "Invalid: no supported HTTPS URL record was found.",
            };
            setOperationMessage(messages[result.result] ?? result.error ?? "Verification failed.");
            await refresh(false);
          } catch (reason) {
            const message = reason instanceof Error ? reason.message : "Verification could not be saved.";
            setError(message);
            setOperationMessage(message);
          }
        },
        async (message) => {
          service.current.stopScan();
          setScanActive(false);
          try {
            await apiRequest("/api/nfc/verify", {
              method: "POST",
              body: JSON.stringify({ cardId: card.id, errorMessage: message }),
            });
          } catch {
            setError("The verification failure could not be saved.");
          }
          setOperationMessage(message);
          await refresh(false);
        },
      );
    } catch (reason) {
      setScanActive(false);
      const message = reason instanceof Error ? reason.message : "NFC verification failed.";
      setError(message);
      try {
        await apiRequest("/api/nfc/verify", {
          method: "POST",
          body: JSON.stringify({ cardId: card.id, errorMessage: message }),
        });
        await refresh(false);
      } catch (logError) {
        setError(`${message} The result could not be saved: ${logError instanceof Error ? logError.message : "server error"}`);
      }
      setOperationMessage(message);
    }
  }

  const totalCards = cards.length;
  const activeCards = cards.filter((card) => card.status === "active").length;
  const unassignedCards = cards.filter((card) => card.business_id === null).length;
  const programmedCards = cards.filter((card) => card.programming_status === "programmed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? <LoaderCircle className="size-4 animate-spin" /> : <Activity className="size-4" />}
          Refresh
        </Button>
        <Button variant="outline" onClick={() => setModal({ type: "business" })}>
          <Plus className="size-4" /> Add business
        </Button>
        <Button onClick={() => setModal({ type: "create-card" })} disabled={activeBusinesses.length === 0}>
          <CreditCard className="size-4" /> Register blank card
        </Button>
        <Button variant="ghost" onClick={() => void signOut()} aria-label="Sign out from NFC administration">
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}<button className="ml-auto" onClick={() => setError("")} aria-label="Dismiss error"><XCircle className="size-4" /></button></div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <div className={`flex items-start gap-3 rounded-xl border p-4 ${support.supported ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
        {support.supported ? <SmartphoneNfc className="mt-0.5 size-5 shrink-0" /> : <CircleHelp className="mt-0.5 size-5 shrink-0" />}
        <div>
          <p className="font-semibold">{support.supported ? "Web NFC is available in this browser" : "NFC scan and write are unavailable"}</p>
          <p className="mt-1 text-sm">{support.supported ? "Use a compatible NFC-enabled Android phone with supported Chrome. NFC actions start only after you click a button." : support.reason}</p>
          <p className="mt-1 text-xs">Production requires HTTPS. Local development may work on localhost or another secure context. iPhone Safari and desktop browser support are not promised.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total NFC cards", totalCards, CreditCard, "text-blue-600 bg-blue-50"],
          ["Active cards", activeCards, Radio, "text-green-600 bg-green-50"],
          ["Unassigned cards", unassignedCards, UserRound, "text-amber-700 bg-amber-50"],
          ["Successfully programmed", programmedCards, ShieldCheck, "text-violet-700 bg-violet-50"],
        ].map(([label, value, Icon, colors]) => {
          const MetricIcon = Icon as typeof CreditCard;
          return (
            <Card key={label as string} className="shadow-sm">
              <CardContent className="flex items-center gap-3 py-4">
                <span className={`flex size-11 items-center justify-center rounded-xl ${colors as string}`}><MetricIcon className="size-5" /></span>
                <span><span className="block text-xs text-slate-500">{label as string}</span><strong className="mt-1 block text-2xl text-[#0f1c33]">{loading ? "—" : value as number}</strong></span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Nfc className="size-5 text-blue-600" />Read an NFC card</CardTitle>
            <CardDescription className="mt-1">Scan and match the NDEF URL against registered cards. URLs are displayed, never opened automatically.</CardDescription>
          </div>
          <div className="flex gap-2">
            {!scanActive ? (
              <Button onClick={() => void startScan()} disabled={!support.supported || pending}>
                <Radio className="size-4" /> Scan NFC card
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopScan}><XCircle className="size-4" /> Stop scanning</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {scanActive && <p className="flex items-center gap-2 text-sm text-blue-800"><LoaderCircle className="size-4 animate-spin" />Scanning. Hold a tag near your phone.</p>}
          {scanResult && <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{scanResult}</p>}
          {unknownUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => void registerScannedCard()} disabled={pending}>Register unrecognized card</Button>
              <span className="text-xs text-slate-500">This records only the HTTPS URL and a generated internal identifier; it does not read a hardware serial number.</span>
            </div>
          )}
          {matches.length > 1 && (
            <div className="flex flex-wrap gap-2">{matches.map((card) => <Button key={card.id} size="sm" variant="outline" onClick={() => { setModal({ type: "view", card }); }}>{card.business_name ?? "Unassigned"} · {card.card_identifier}</Button>)}</div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><CardTitle>NFC cards</CardTitle><CardDescription className="mt-1">Manage assignments, redirect URLs, programming, and verification.</CardDescription></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards" className="pl-8 sm:w-48" />
            </label>
            <select aria-label="Filter NFC cards" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-8 rounded-lg border border-input bg-white px-2 text-sm">
              <option value="all">All statuses</option><option value="unassigned">Unassigned</option><option value="unprogrammed">Unprogrammed</option><option value="registered">Registered</option><option value="programmed">Programmed</option><option value="failed">Failed</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Business</th><th className="px-4 py-3">Card identifier</th><th className="px-4 py-3">NFC URL</th><th className="px-4 py-3">Google Review URL</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last scanned</th><th className="px-4 py-3">Last result</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y">
                {loading ? <tr><td colSpan={8} className="p-10 text-center text-slate-500"><LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />Loading NFC cards...</td></tr> :
                  filteredCards.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-slate-500">{cards.length ? "No cards match this search or filter." : "No NFC cards registered yet. Add a business, then register a blank card."}</td></tr> :
                  filteredCards.map((card) => (
                    <tr key={card.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4 font-medium text-[#0f1c33]">{card.business_name ?? <span className="text-slate-400">Unassigned</span>}<span className="mt-1 block text-xs text-slate-400">{card.status}</span></td>
                      <td className="px-4 py-4 font-mono text-xs">{card.card_identifier}</td>
                      <td className="max-w-52 break-all px-4 py-4 text-xs text-blue-700">{card.expected_ndef_url ?? "—"}</td>
                      <td className="max-w-52 break-all px-4 py-4 text-xs text-slate-500">{card.business_id ? businesses.find((business) => business.id === card.business_id)?.google_review_url ?? "—" : "—"}</td>
                      <td className="px-4 py-4"><StatusBadge value={card.programming_status} /></td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatDate(card.last_scanned_at)}</td>
                      <td className="px-4 py-4">{card.last_operation_result ? <StatusBadge value={card.last_operation_result} /> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-4"><div className="flex flex-wrap gap-1">
                        <Button size="xs" variant="outline" onClick={() => setModal({ type: "view", card })}>View</Button>
                        <Button size="xs" variant="outline" onClick={() => void startScan()} disabled={!support.supported}>Scan</Button>
                        <Button size="xs" variant="outline" onClick={() => { setOverwrite(false); setOperationMessage(""); setModal({ type: "write", card }); }} disabled={!support.supported || !card.business_id}>Write</Button>
                        <Button size="xs" variant="outline" onClick={() => { setOperationMessage(""); setModal({ type: "verify", card }); }} disabled={!support.supported}>Verify</Button>
                        <Button size="xs" variant="outline" onClick={() => { setAssignBusinessId(card.business_id ? String(card.business_id) : ""); setModal({ type: "assign", card }); }}>Reassign</Button>
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-5 py-3 text-xs text-slate-500">{filteredCards.length} of {totalCards} NFC cards</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-5 text-blue-600" />Recent NFC operations</CardTitle><CardDescription>Browser-reported scans, writes, verification results, and registrations. Redirect visits are logged separately and are not proof of NFC taps.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {operations.length === 0 ? <p className="py-5 text-center text-sm text-slate-500">No NFC operations have been recorded.</p> : operations.map((operation) => (
            <div key={operation.id} className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
              {operation.result === "success" ? <CheckCircle2 className="size-4 text-green-600" /> : operation.result === "mismatch" ? <AlertCircle className="size-4 text-orange-600" /> : <XCircle className="size-4 text-red-600" />}
              <span className="min-w-28 font-medium capitalize">{operation.operation_type}</span>
              <StatusBadge value={operation.result} />
              <span className="text-xs text-slate-500">{operation.business_name ?? operation.card_identifier ?? "Unregistered tag"}</span>
              {operation.error_message && <span className="text-xs text-red-700">{operation.error_message}</span>}
              <time className="ml-auto text-xs text-slate-400">{formatDate(operation.created_at)}</time>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={modal !== null} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {modal?.type === "business" && <>
            <DialogHeader><DialogTitle>Add business</DialogTitle><DialogDescription>Business review URLs are limited to approved HTTPS Google destinations. Its slug becomes the public redirect path.</DialogDescription></DialogHeader>
            <form onSubmit={(event) => void submitBusiness(event)} className="space-y-4">
              <label className="block space-y-1 text-sm font-medium">Business name<Input required maxLength={160} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label>
              <label className="block space-y-1 text-sm font-medium">Slug (optional)<Input maxLength={100} placeholder="generated-from-business-name" value={businessSlug} onChange={(event) => setBusinessSlug(event.target.value)} /></label>
              <label className="block space-y-1 text-sm font-medium">Google Review URL<Input required type="url" placeholder="https://g.page/r/.../review" value={reviewUrl} onChange={(event) => setReviewUrl(event.target.value)} /></label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save business"}</Button>
              </div>
            </form>
          </>}
          {modal?.type === "create-card" && <>
            <DialogHeader><DialogTitle>Register blank NFC card</DialogTitle><DialogDescription>Choose a business. The server creates a secure redirect URL to write to the physical card.</DialogDescription></DialogHeader>
            <form onSubmit={(event) => void submitNewCard(event)} className="space-y-4">
              <label className="block space-y-1 text-sm font-medium">Business<select required value={newCardBusinessId} onChange={(event) => setNewCardBusinessId(event.target.value)} className="h-10 w-full rounded-lg border bg-white px-3"><option value="">Select a business</option>{activeBusinesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
              <p className="break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-600">The generated URL is bound to the server&apos;s configured public origin. Set NFC_PUBLIC_BASE_URL for production HTTPS.</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" disabled={pending || !newCardBusinessId}>{pending ? "Registering..." : "Register card"}</Button>
              </div>
            </form>
          </>}
          {modal?.type === "assign" && <>
            <DialogHeader><DialogTitle>Assign NFC card</DialogTitle><DialogDescription>Changing a card&apos;s business changes its expected redirect. You must rewrite the physical tag afterward.</DialogDescription></DialogHeader>
            <form onSubmit={(event) => void submitAssignment(event)} className="space-y-4">
              <p className="font-mono text-xs">{modal.card.card_identifier}</p>
              <label className="block space-y-1 text-sm font-medium">Business<select value={assignBusinessId} onChange={(event) => setAssignBusinessId(event.target.value)} className="h-10 w-full rounded-lg border bg-white px-3"><option value="">Unassigned</option>{activeBusinesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save assignment"}</Button>
              </div>
            </form>
          </>}
          {modal?.type === "write" && <>
            <DialogHeader><DialogTitle>Write NFC card</DialogTitle><DialogDescription>Use an NFC-enabled Android phone and hold a blank or rewritable tag near the device after pressing the button.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <p className="font-medium">{modal.card.business_name}</p>
              <p className="break-all rounded-lg bg-slate-50 p-3 text-xs text-blue-800">{modal.card.expected_ndef_url}</p>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)} />I explicitly allow overwriting existing NFC tag content.</label>
              <p className="text-xs text-slate-500">Without this confirmation the browser is asked not to overwrite a non-empty tag. NFC chip capabilities cannot always be fully inspected. Tags are never permanently locked by this app.</p>
              {operationMessage && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{operationMessage}</p>}
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Close</Button><Button disabled={pending || !support.supported} onClick={() => void writeCard(modal.card)}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Nfc className="size-4" />}Write NFC card</Button></div>
            </div>
          </>}
          {modal?.type === "verify" && <>
            <DialogHeader><DialogTitle>Verify NFC card</DialogTitle><DialogDescription>Tap the selected card and compare its URL with the expected value stored for this card.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <p className="font-medium">{modal.card.business_name ?? "Unassigned"} · <span className="font-mono text-xs">{modal.card.card_identifier}</span></p>
              <p className="break-all rounded-lg bg-slate-50 p-3 text-xs">{modal.card.expected_ndef_url ?? "No expected URL assigned."}</p>
              {operationMessage && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{operationMessage}</p>}
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { stopScan(); setModal(null); }}>Close</Button><Button disabled={scanActive || !support.supported || !modal.card.expected_ndef_url} onClick={() => void startVerification(modal.card)}>{scanActive ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}Verify card</Button></div>
            </div>
          </>}
          {modal?.type === "view" && <>
            <DialogHeader><DialogTitle>NFC card details</DialogTitle><DialogDescription>Card identifiers are internal database IDs, not hardware serial numbers.</DialogDescription></DialogHeader>
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-3 text-sm">
              <dt className="text-slate-500">Business</dt><dd>{modal.card.business_name ?? "Unassigned"}</dd>
              <dt className="text-slate-500">Card identifier</dt><dd className="break-all font-mono text-xs">{modal.card.card_identifier}</dd>
              <dt className="text-slate-500">Status</dt><dd><StatusBadge value={modal.card.status} /></dd>
              <dt className="text-slate-500">Programming</dt><dd><StatusBadge value={modal.card.programming_status} /></dd>
              <dt className="text-slate-500">Redirect URL</dt><dd className="break-all text-xs">{modal.card.redirect_url ?? "—"}</dd>
              <dt className="text-slate-500">Expected NFC URL</dt><dd className="break-all text-xs">{modal.card.expected_ndef_url ?? "—"}</dd>
              <dt className="text-slate-500">Last programmed</dt><dd>{formatDate(modal.card.last_programmed_at)}</dd>
              <dt className="text-slate-500">Last verified</dt><dd>{formatDate(modal.card.last_verified_at)}</dd>
              <dt className="text-slate-500">Last scanned</dt><dd>{formatDate(modal.card.last_scanned_at)}</dd>
            </dl>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
