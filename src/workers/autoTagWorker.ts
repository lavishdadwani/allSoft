// Mock AI auto-tagging / OCR simulation (assignment section 7.2 explicitly allows
// "a mock worker" in place of a real OCR pass). Runs in a Web Worker so a real
// implementation could later drop in an actual vision/OCR call without blocking
// the UI thread — the mock keeps that same async, off-main-thread shape rather
// than just being a plain synchronous function.
export interface AutoTagRequest {
  fileName: string
  fileType: string
  majorHead: string
  minorHead: string
  remarks: string
}

export interface AutoTagResponse {
  tags: string[]
}

const ctx = self as unknown as Worker

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'doc', 'document',
  'file', 'files', 'scan', 'scanned', 'copy', 'img', 'image', 'photo', 'final',
  'new', 'old', 'untitled',
])

export function tokensFrom(text: string): string[] {
  return text
    .replace(/\.[a-z0-9]+$/i, '') // strip a file extension if present
    .split(/[^a-zA-Z0-9]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t))
}

ctx.onmessage = (event: MessageEvent<AutoTagRequest>) => {
  const { fileName, fileType, majorHead, minorHead, remarks } = event.data

  // Simulate the latency of a real vision/OCR pass rather than resolving
  // instantly, so the UI's "analyzing…" state is exercised meaningfully.
  setTimeout(() => {
    const suggestions = new Set<string>()

    if (majorHead) suggestions.add(majorHead.toLowerCase())
    if (minorHead) suggestions.add(minorHead.toLowerCase())
    if (fileType.includes('pdf')) suggestions.add('pdf')
    else if (fileType.startsWith('image/')) suggestions.add('scanned-image')

    for (const token of tokensFrom(fileName)) suggestions.add(token)
    for (const token of tokensFrom(remarks)) suggestions.add(token)

    const response: AutoTagResponse = { tags: [...suggestions].slice(0, 6) }
    ctx.postMessage(response)
  }, 500)
}
