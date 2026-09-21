# AllSoft DMS — Document Management System (Frontend)

A React + TypeScript front-end for the AllSoft Document Management System: OTP login,
document upload with tagging, filtered search, virtualized results, in-browser preview,
and ZIP download — built against the API described in the provided Postman collection.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript, built with Vite |
| Routing | React Router v6 |
| Server state / caching | TanStack Query (optimistic mutations, retries, cache) |
| Virtualized lists | `@tanstack/react-virtual` |
| Runtime schema validation | Zod (form input **and** API response shape) |
| Offline cache | IndexedDB via `idb` |
| ZIP generation | `fflate`, run inside a native Web Worker |
| Styling | Tailwind CSS |
| Tests | Vitest + React Testing Library |

The backend Postman collection used to build this integration is included at
[`postman/allsoft-document-management.postman_collection.json`](postman/allsoft-document-management.postman_collection.json).

## Getting started

```bash
npm install
cp .env.example .env   # defaults to https://apis.allsoft.co/api/documentManagement
npm run dev             # http://localhost:5173
```

### Running tests

```bash
npm test            # single run
npm run test:watch  # watch mode
```

### Production build

```bash
npm run build     # tsc -b && vite build, output in dist/
npm run preview   # serve the production build locally
```

### Deploying to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

`vercel.json` at the project root rewrites all paths to `index.html` so client-side
routes (`/login`, `/admin/create-user`, `/`) don't 404 on a hard refresh.

## Feature map (assignment → implementation)

1. **Project setup** — Vite + React + TypeScript, path alias `@/*` → `src/*`.
2. **Login (OTP) & static admin form**
   - [`LoginPage`](src/components/auth/LoginPage.tsx): mobile number → `generateOTP` →
     OTP → `validateOTP`. The returned token is stored (`src/lib/session.ts`) and
     attached to every subsequent request as a `token` header via an axios
     interceptor ([`src/api/client.ts`](src/api/client.ts)) — the API expects it there,
     not as `Authorization: Bearer`.
   - [`AdminUserForm`](src/components/auth/AdminUserForm.tsx): a static username/password
     form at `/admin/create-user`. The Postman collection has no user-management
     endpoint, so this only demonstrates the UI/validation and keeps a local list of
     created usernames (the password is validated but **never persisted**, even
     locally).
3. **File upload** — [`UploadForm`](src/components/upload/UploadForm.tsx): date picker,
   Personal/Professional dropdown (`major_head`), a dependent second dropdown
   (`minor_head` — Names for Personal, Departments for Professional), a tag input with
   autocomplete backed by `documentTags` plus free-form tag creation, a remarks field,
   and file-type/size validation restricted to PDF/PNG/JPG/WEBP.
4. **Search** — [`SearchForm`](src/components/search/SearchForm.tsx): category
   dropdowns, tag filter, from/to date range, and free-text search.
5. **Preview & download** — [`ResultsList`](src/components/search/ResultsList.tsx) +
   [`PreviewModal`](src/components/search/PreviewModal.tsx): per-row preview (PDF via
   `<iframe>`, images via `<img>`, anything else shows an explicit "not supported"
   message), per-row download, and a "download selected/all as ZIP" action.
6. **Performance, architecture & resilience**
   - **Optimistic UI + rollback**: [`useUploadDocument`](src/hooks/useUploadDocument.ts)
     adds an optimistic "pending" row to a recent-uploads list on `onMutate`, marks it
     `success` in `onSuccess`, and rolls back to the prior list in `onError`.
   - **Virtualized results**: `ResultsList` uses `@tanstack/react-virtual` so a page of
     up to 2000 search results renders smoothly (fixed-height rows, windowed DOM).
   - **Web Worker ZIP**: [`src/workers/zipWorker.ts`](src/workers/zipWorker.ts) fetches
     each selected file and zips them with `fflate` off the main thread; progress and
     the final buffer are streamed back via `postMessage` ([`useZipDownload`](src/hooks/useZipDownload.ts)).
   - **Zod validation**: request payloads (`uploadFormSchema`, `searchRequestSchema`,
     auth schemas) are validated before every request; response bodies are validated
     with lenient/passthrough schemas that degrade gracefully (log + empty result)
     instead of crashing when the server's shape drifts from what's expected.
   - **Offline fallback**: [`src/lib/offlineCache.ts`](src/lib/offlineCache.ts) caches
     the last successful search results and tag list in IndexedDB; if a search or tag
     fetch fails (e.g. offline), the last cached copy is shown with a visible
     "cached" banner. A top-level [`NetworkStatusBanner`](src/components/common/NetworkStatusBanner.tsx)
     tracks `online`/`offline` events.

Section 7 (bonus AI features) was intentionally skipped to prioritize the mandatory
scope above.

## Architecture notes

- **State management**: server state (auth, uploads, search, tags) lives in TanStack
  Query; local UI state (form fields, filters, modal visibility) is plain React state.
  Session (token/user id) is a small React Context (`AuthContext`) backed by
  `localStorage` so a refresh doesn't log the user out.
- **API layer** (`src/api/*`) is the only place that talks to axios; components and
  hooks never call `apiClient` directly. All request/response shapes are validated at
  this boundary (`src/types/*`, Zod).
- **`minor_head` options** (names for Personal, departments for Professional) are
  static lists (`src/types/document.ts`) per the assignment brief — the API doesn't
  expose an endpoint for these.
- **`user_id`**: `validateOTP` only returns a token, no user profile — so the app
  uses the mobile number itself as `user_id` for `saveDocumentEntry` /
  `searchDocumentEntry`. Confirmed working live (search-by-`uploaded_by` correctly
  finds documents uploaded through this app using the logged-in mobile number).
- **Auth header scoping**: the backend expects a custom `token` header (not
  `Authorization: Bearer`) on every authenticated request to *our own API* —
  centralized as `AUTH_HEADER_NAME` (`src/lib/authHeader.ts`). This must **not** be
  attached to requests going anywhere else: `apiClient`'s interceptor
  (`src/api/client.ts`) only adds it when `isSameOriginAsApi()` says the request
  target is our API's own origin, and the ZIP worker's `fetch` calls apply the same
  same-origin check before adding it (files are pre-signed S3 URLs on a different
  origin — see "Confirmed live backend behavior" below for why this matters). A 401
  from `apiClient` clears the session and dispatches a `dms:session-expired` window
  event that `AuthContext` listens for, so the UI actually drops back to the login
  screen instead of silently continuing to look "logged in" while every request
  fails. The ZIP worker can't go through `apiClient`, so it reports back an
  `unauthorizedCount`; `ResultsList` treats a nonzero count as the same
  session-expired signal.

## Confirmed live backend behavior

The Postman collection documents request shapes but not response shapes. Every
endpoint has now been probed directly against the live backend with a real
authenticated token (not just guessed from the request examples):

- **Every endpoint returns HTTP 200 even on business-logic failure.** The envelope is
  consistently `{status: boolean, data?: string, message?: string}` — e.g.
  `generateOTP` for an unregistered number: `{"status": false, "data": "This Mobile
  Number is not yet Registered."}`; `saveDocumentEntry` for a missing file:
  `{"status": false, "message": "Invalid File."}`. axios never throws on these, so
  `status` has to be checked explicitly on every call. This is centralized in
  `src/lib/apiEnvelope.ts` (`isSuccessStatus`, `assertEnvelopeSuccess`,
  `getEnvelopeErrorMessage`) and used by `src/api/auth.ts` and `src/api/documents.ts`.
  This caught a real bug during development: `uploadDocument` originally didn't check
  `status` at all, so a failed upload (e.g. an invalid file) would have been reported
  to the user as a success.
- **`documentTags` returns `{id, label}` objects**, e.g. `{"data": [{"id":
  "Assignment", "label": "Assignment"}], "status": true}` — a different shape from the
  `{tag_name}` used for tags everywhere else (`saveDocumentEntry`,
  `searchDocumentEntry`). `tagSuggestionSchema` (`src/types/document.ts`) normalizes
  `{id, label}` / `{tag_name}` / a bare string down to a plain tag name.
- **`searchDocumentEntry`'s success shape is confirmed**:
  `{"status": true, "data": [...], "recordsTotal": N, "recordsFiltered": N}`, and each
  row looks like:
  ```json
  {
    "document_id": 25, "major_head": "Professional", "minor_head": "IT",
    "file_url": "https://allsoft-consulting.s3.ap-south-1.amazonaws.com/fileUploads/...?X-Amz-Signature=...",
    "document_date": "2024-02-01T00:00:00", "document_remarks": "test",
    "upload_time": "2024-02-26T16:14:33", "uploaded_by": "Sagar"
  }
  ```
  Notably, **no row in 322+ real documents ever included a `tags` field** — tags can be
  used to *filter* a search, but don't come back on each result, so there's currently
  no way for the UI to display which tags a document has after the fact. This is a
  backend/API limitation, not a frontend gap; `normalizeDocumentEntry` handles the
  missing field gracefully (empty tag list) rather than crashing.
- **`file_url` is a pre-signed AWS S3 URL, and that S3 bucket has no CORS
  configuration at all** (confirmed directly: an S3 preflight probe returns
  `CORSResponse: CORS is not enabled for this bucket`). This mattered a lot:
  - A plain `<img src>` / `<iframe src>` works fine — that's just a resource load, no
    CORS needed. **`PreviewModal` relies on this** and does *not* fetch the file as a
    blob (an earlier version did, based on an incorrect assumption that the file
    endpoint needed our app's auth header — it doesn't; the pre-signed URL
    authenticates itself).
  - Any `fetch()`/XHR that tries to **read** the response (to force a specific
    filename on download, or to bundle bytes into a ZIP) *is* blocked by the browser,
    auth header or not. `downloadFile` (`src/lib/download.ts`) tries a blob fetch
    first and falls back to `window.open(url, '_blank')` if that fails, so the user
    still has a path to save the file. The ZIP worker now surfaces a clear error
    (`"None of the selected files could be bundled…"`) instead of silently producing
    a broken/empty archive when every file in a batch is CORS-blocked, and reports a
    skip count when only some are.
  - `apiClient`'s auth-token interceptor was originally unconditional, which meant it
    attached our app's session token to every request through it — including
    `apiClient.get(fileUrl)` for downloads, leaking the token to a third-party AWS
    domain. Fixed with `isSameOriginAsApi()` (`src/api/client.ts`): the token is only
    attached to requests actually going to our own API origin.

## Project structure

```
src/
  api/            axios client + typed endpoint wrappers (auth, documents)
  components/
    auth/         Login (OTP) + static admin user form
    upload/       Upload form
    search/       Search form, virtualized results, preview modal
    common/       Shared UI: tag input, toasts, route guard, offline banner
  context/        Auth + toast React contexts
  hooks/          TanStack Query hooks, zip download, online status
  lib/            session storage, offline cache (IndexedDB), date/normalize helpers
  pages/          DashboardPage (tab layout for Upload / Search)
  types/          Zod schemas + inferred types for auth and documents
  workers/        Web Worker for ZIP generation
```
