"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function NfcSignIn({ configured }: { configured: boolean }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/nfc/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed.");
      setToken("");
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {configured ? <KeyRound className="size-5 text-blue-600" /> : <ShieldAlert className="size-5 text-amber-600" />}
          NFC administrator access
        </CardTitle>
        <CardDescription>
          {configured
            ? "Enter the administrator token configured on the server. It is sent over the same origin and retained only in an HttpOnly session cookie."
            : "NFC management is disabled until a secure administrator token is configured in the server environment."}
        </CardDescription>
      </CardHeader>
      {configured && (
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              NFC admin token
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
