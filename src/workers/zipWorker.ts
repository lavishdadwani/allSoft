import { zipSync, type Zippable } from 'fflate'

export interface ZipWorkerFile {
  name: string
  url: string
}

export interface ZipWorkerRequest {
  files: ZipWorkerFile[]
}

export type ZipWorkerResponse =
  | { type: 'progress'; completed: number; total: number; fileName: string }
  | { type: 'done'; buffer: ArrayBuffer }
  | { type: 'error'; message: string }

// Cast away the DOM `self` typing so we don't have to reconcile the DOM and
// WebWorker lib globals (they redeclare the same identifiers and conflict
// when both are loaded in one tsconfig).
const ctx = self as unknown as Worker

function dedupeName(existing: Zippable, name: string): string {
  let candidate = name
  let i = 1
  while (candidate in existing) {
    candidate = `${i}-${name}`
    i += 1
  }
  return candidate
}

ctx.onmessage = async (event: MessageEvent<ZipWorkerRequest>) => {
  const { files } = event.data
  const zippable: Zippable = {}
  let completed = 0

  for (const file of files) {
    try {
      const response = await fetch(file.url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = new Uint8Array(await response.arrayBuffer())
      zippable[dedupeName(zippable, file.name)] = buffer
    } catch {
      // Skip files that fail to download; the rest of the ZIP still gets built.
    } finally {
      completed += 1
      const progress: ZipWorkerResponse = { type: 'progress', completed, total: files.length, fileName: file.name }
      ctx.postMessage(progress)
    }
  }

  try {
    const zipped = zipSync(zippable, { level: 6 })
    const buffer = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength)
    const done: ZipWorkerResponse = { type: 'done', buffer }
    ctx.postMessage(done, [buffer])
  } catch (err) {
    const message: ZipWorkerResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : 'ZIP generation failed',
    }
    ctx.postMessage(message)
  }
}
