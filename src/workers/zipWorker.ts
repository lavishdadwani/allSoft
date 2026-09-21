import { zipSync, type Zippable } from 'fflate'
import { AUTH_HEADER_NAME } from '@/lib/authHeader'

export interface ZipWorkerFile {
  name: string
  url: string
}

export interface ZipWorkerRequest {
  files: ZipWorkerFile[]
  token?: string | null
  // Origin of the document-management API (e.g. https://apis.allsoft.co). Only
  // fetches to this origin get the auth header attached — files served from
  // elsewhere (a CDN, a pre-signed URL) would have an unexpected header break a
  // signature or trigger a CORS preflight the host doesn't allow.
  apiOrigin?: string
}

export type ZipWorkerResponse =
  | { type: 'progress'; completed: number; total: number }
  | { type: 'done'; buffer: ArrayBuffer; unauthorizedCount: number; skippedCount: number }
  | { type: 'error'; message: string }

// Cast away the DOM `self` typing so we don't have to reconcile the DOM and
// WebWorker lib globals (they redeclare the same identifiers and conflict
// when both are loaded in one tsconfig).
const ctx = self as unknown as Worker

const CONCURRENCY = 6

function dedupeName(existing: Zippable, name: string): string {
  let candidate = name
  let i = 1
  while (candidate in existing) {
    candidate = `${i}-${name}`
    i += 1
  }
  return candidate
}

function sameOrigin(url: string, origin: string | undefined): boolean {
  if (!origin) return false
  try {
    return new URL(url, origin).origin === origin
  } catch {
    return false
  }
}

type FetchOutcome = 'ok' | 'unauthorized' | 'failed'

async function fetchOne(
  file: ZipWorkerFile,
  token: string | null | undefined,
  apiOrigin: string | undefined,
  zippable: Zippable,
): Promise<FetchOutcome> {
  try {
    const headers =
      token && sameOrigin(file.url, apiOrigin) ? { [AUTH_HEADER_NAME]: token } : undefined
    const response = await fetch(file.url, headers ? { headers } : undefined)
    if (!response.ok) {
      return response.status === 401 ? 'unauthorized' : 'failed'
    }
    const buffer = new Uint8Array(await response.arrayBuffer())
    zippable[dedupeName(zippable, file.name)] = buffer
    return 'ok'
  } catch {
    // Network failure, or the browser blocking a cross-origin read because the
    // host has no CORS configuration (confirmed against the real file storage
    // used by this app) — either way, skip this file and keep the rest going.
    return 'failed'
  }
}

ctx.onmessage = async (event: MessageEvent<ZipWorkerRequest>) => {
  const { files, token, apiOrigin } = event.data
  const zippable: Zippable = {}
  let completed = 0
  let unauthorizedCount = 0
  let skippedCount = 0

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map((file) => fetchOne(file, token, apiOrigin, zippable)))
    for (const outcome of results) {
      completed += 1
      if (outcome === 'unauthorized') unauthorizedCount += 1
      if (outcome === 'failed') skippedCount += 1
    }
    const progress: ZipWorkerResponse = { type: 'progress', completed, total: files.length }
    ctx.postMessage(progress)
  }

  if (Object.keys(zippable).length === 0) {
    const message: ZipWorkerResponse = {
      type: 'error',
      message:
        unauthorizedCount > 0
          ? 'Your session has expired.'
          : "None of the selected files could be bundled — they may be hosted somewhere that blocks browser downloads. Try downloading them individually instead.",
    }
    ctx.postMessage(message)
    return
  }

  try {
    const zipped = zipSync(zippable, { level: 6 })
    const buffer = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength)
    const done: ZipWorkerResponse = { type: 'done', buffer, unauthorizedCount, skippedCount }
    ctx.postMessage(done, [buffer])
  } catch (err) {
    const message: ZipWorkerResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : 'ZIP generation failed',
    }
    ctx.postMessage(message)
  }
}
