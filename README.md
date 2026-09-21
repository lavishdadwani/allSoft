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
  `searchDocumentEntry`. Worth confirming this is what the backend actually expects
  once a real login can be tested end-to-end.
- **Auth consistency across three code paths**: the backend expects a custom `token`
  header (not `Authorization: Bearer`) on every authenticated request. This is
  centralized as `AUTH_HEADER_NAME` (`src/lib/authHeader.ts`) and used by (1)
  `apiClient`'s axios interceptor for normal requests/downloads, (2) the preview
  modal, which fetches the file as an authenticated blob rather than setting
  `<img>`/`<iframe> src` directly (browsers won't let you attach custom headers to
  those), and (3) the ZIP web worker's own `fetch` calls, which only attach the
  token when the file URL's origin matches the API's origin (so an unrelated
  CDN/pre-signed URL doesn't get an unexpected header). A 401 from `apiClient`
  clears the session and dispatches a `dms:session-expired` window event that
  `AuthContext` listens for, so the UI actually drops back to the login screen
  instead of silently continuing to look "logged in" while every request fails.
  The ZIP worker can't go through `apiClient`, so it reports back an
  `unauthorizedCount`; `ResultsList` treats a nonzero count as the same
  session-expired signal.

## Known gaps / things to verify against the live backend

The Postman collection documents request shapes but not response shapes. I probed the
live API directly (`curl`) to confirm what I could without a valid session:

- **Confirmed**: `generateOTP` / `validateOTP` return HTTP 200 even on business-logic
  failure, with a body like `{"status": false, "data": "This Mobile Number is not yet
  Registered."}` or `{"status": false, "message": "Error : Invalid OTP"}`. The code
  handles this (`src/types/auth.ts`, `src/api/auth.ts`) — status must be checked
  explicitly since axios won't throw on its own. A number has since been registered
  with AllSoft and the full OTP login flow works end-to-end.
- **Confirmed**: `documentTags` returns tag suggestions shaped as
  `{"data": [{"id": "Assignment", "label": "Assignment"}], "status": true}` — notably
  `{id, label}`, **not** the `{tag_name}` shape `saveDocumentEntry` /
  `searchDocumentEntry` use for tags elsewhere. `tagSuggestionSchema`
  (`src/types/document.ts`) normalizes `{id, label}`, `{tag_name}`, or a bare string
  down to a plain tag-name string; `fetchDocumentTags` (`src/api/documents.ts`) is the
  only place this distinction matters; outgoing tag payloads are still `{tag_name}`
  only. (This mismatch is exactly the kind of drift the defensive response parsing
  was built to catch — it silently fell back to an empty list rather than crashing,
  which is how it was first noticed: tags weren't showing up with no visible error.)
- **Still to verify**: the exact success-response shapes for `saveDocumentEntry` and
  `searchDocumentEntry` — run a real upload and search once login is confirmed
  working, and check the browser console for any "response did not match expected
  shape" warnings from `src/api/documents.ts`. The normalization layer is
  intentionally defensive (falls back to empty results and logs a console warning
  rather than crashing) if the real shape differs from what's assumed.
- File preview/download assumes each search result includes a directly fetchable file
  URL (checked in order: `file_url`, `path`, `document_path`). If the real API returns
  a different key, update `normalizeDocumentEntry` in `src/lib/normalize.ts`.
- Preview, single-file download, and ZIP download all authenticate consistently now
  (see "Auth consistency across three code paths" above) — this was a real gap in an
  earlier version of this app, fixed and verified by code inspection. Still worth a
  live pass now that login works, to confirm the file endpoint actually behaves the
  way the fix assumes.

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
