# Ascend Media Works

Next.js App Router application using TypeScript, Tailwind CSS, shadcn/ui, Node.js, and MySQL.

## Run locally

Requirements: Node.js 20.9 or later and the existing XAMPP MySQL database.

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). MySQL defaults to
`127.0.0.1:3307`, database `social_media`, user `root`, and a blank password to
match the current local XAMPP setup. Override these values in a `.env.local`
file when needed; see [.env.example](./.env.example).

The application expects the existing `qr_code` and `ga4_configuration` tables.
Existing QR PNGs are kept in `public/qr-images`. Newly created QR images are
also generated there.

## NFC management

NFC management is available at `/nfc`. The project did not have user accounts
or an authentication system, so NFC management uses a dedicated shared admin
token. Set `NFC_ADMIN_TOKEN` in `.env.local` to a randomly generated value of
at least 32 characters. It is checked server-side and exchanged for an
HttpOnly, same-site cookie; it is not included in the browser JavaScript bundle.
This token only gates NFC endpoints; it does not add authentication to the
existing dashboard pages.

Generate a token in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

Copy the generated value into `.env.local` as `NFC_ADMIN_TOKEN=...`. Keep that
file private and never commit it. In production, also set
`NFC_PUBLIC_BASE_URL` to the public HTTPS origin that Android phones can reach,
for example `https://reviews.example.com`. In local development the redirect
origin defaults to the local request origin; production refuses to generate
redirects without an explicit HTTPS base URL.

Create the NFC tables once in the existing MySQL database by importing
[`database/nfc-schema.sql`](./database/nfc-schema.sql). With XAMPP's MySQL
client and the defaults shown in `.env.example`:

```powershell
Get-Content -Raw .\database\nfc-schema.sql | & 'C:\xampp\mysql\bin\mysql.exe' -h 127.0.0.1 -P 3307 -u root social_media
```

The migration creates `nfc_businesses`, `nfc_cards`, `nfc_operations`, and
`nfc_redirect_visits`; it does not change the QR or GA4 tables. Add a business
with an approved HTTPS Google Review URL, register a blank card for it, then
write the generated `/r/<business-slug>` redirect URL to the tag. Supported
review destinations include Google `g.page` review links, Google Search
write-review links, and Google Maps URLs. The public redirect rejects inactive
businesses and does not accept destination URLs from request parameters.

### Web NFC compatibility and device testing

Web NFC is browser/device dependent and generally requires a compatible,
NFC-enabled Android phone running a supported version of Chrome. The feature
checks `NDEFReader` and the secure context before enabling operations, requires
a user click to scan or write, and reports permission, NFC-disabled, and tag
errors. It does not promise support for iPhone Safari or desktop browsers.
Production must use HTTPS. Localhost is treated as a secure context on the
device that opens localhost; an Android phone accessing a PC by its plain HTTP
LAN address is not a secure context. For a phone test, use an HTTPS hostname or
tunnel reachable from the phone and set `NFC_PUBLIC_BASE_URL` to that origin.

To test with real hardware:

1. Run the app and database on an HTTPS origin reachable from an NFC-enabled
   Android phone; sign in to `/nfc` with the admin token.
2. Create a business using its Google Review URL, then register a blank or
   rewritable NFC card for that business.
3. On the phone, select **Write**, review the generated redirect URL, and tap
   **Write NFC card** before holding the tag against the phone. Allow overwrite
   only if you explicitly intend to replace existing tag contents.
4. Use **Verify** and tap that card to compare the URL stored on the tag with
   the server's expected URL. Test **Scan NFC card** separately to match
   registered URLs or register an    unrecognized HTTPS URL (localhost-only HTTP URLs are accepted in development).
5. Open the business redirect on a separate device and confirm it lands on the
   configured Google destination. That visit is logged separately and is not
   evidence that the link came from an NFC tap.

The application does not permanently lock tags and cannot reliably inspect
every tag's chip properties. Browser-reported write/scan outcomes are recorded
as operations; physical-device behavior must be tested with the actual Android
phone and NFC tags. No hardware test is performed by the build or API checks.

NFC API routes under `/api/nfc` require the admin session. They provide card
listing/details/registration/assignment, business listing/creation, redirect
URL generation, scan/write/verification result recording, and operation
history. The `/r/[slug]` redirect is intentionally public; its destination is
looked up from the active business record and validated server-side. Redirect
visits have a separate log from NFC operations.

## Google Analytics 4

Configure the numeric GA4 Property ID and upload a Google Cloud service-account
JSON key at `/configuration`. The key is stored outside the project by default
at `C:\xampp\social-media-private` on Windows. Set `GA4_CREDENTIAL_DIR` to a
different private directory if needed. Do not put the key under `public`, share
it, or commit it.

Enable the Google Analytics Data API and give the service account Viewer access
to the GA4 property. Reports are loaded server-side from `/analytics`.

## Production checks

```powershell
npm run typecheck
npm run lint
npm run build
npm start
```
