import { openDB, type IDBPDatabase } from 'idb'
import type { SearchResult } from '@/api/documents'
import type { Tag } from '@/types/document'

const DB_NAME = 'dms-offline-cache'
const DB_VERSION = 1
const SEARCH_STORE = 'searches'
const TAG_STORE = 'tags'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SEARCH_STORE)) {
          db.createObjectStore(SEARCH_STORE)
        }
        if (!db.objectStoreNames.contains(TAG_STORE)) {
          db.createObjectStore(TAG_STORE)
        }
      },
    })
  }
  return dbPromise
}

export async function cacheSearchResult(key: string, result: SearchResult): Promise<void> {
  try {
    const db = await getDb()
    await db.put(SEARCH_STORE, { result, cachedAt: Date.now() }, key)
  } catch {
    // Offline caching is best-effort; ignore storage failures (e.g. private browsing).
  }
}

export async function getCachedSearchResult(
  key: string,
): Promise<{ result: SearchResult; cachedAt: number } | undefined> {
  try {
    const db = await getDb()
    return await db.get(SEARCH_STORE, key)
  } catch {
    return undefined
  }
}

export async function cacheTags(term: string, tags: Tag[]): Promise<void> {
  try {
    const db = await getDb()
    await db.put(TAG_STORE, tags, term)
  } catch {
    // best-effort
  }
}

export async function getCachedTags(term: string): Promise<Tag[] | undefined> {
  try {
    const db = await getDb()
    return await db.get(TAG_STORE, term)
  } catch {
    return undefined
  }
}

export function makeSearchCacheKey(filters: Record<string, unknown>): string {
  return JSON.stringify(filters)
}
