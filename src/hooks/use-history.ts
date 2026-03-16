import { useState, useCallback } from 'react'
import type { HistoryEntry } from '@/types'

const HISTORY_KEY = 'zporter-history'
const MAX_ENTRIES = 500

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES))) } catch {}
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory)

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setEntries(prev => {
      const next = [{ ...entry, id: crypto.randomUUID(), timestamp: Date.now() }, ...prev].slice(0, MAX_ENTRIES)
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
  }, [])

  return { entries, addEntry, clearHistory }
}
