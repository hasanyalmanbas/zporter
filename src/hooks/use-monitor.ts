import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { WatchedPort, PortInfo, ProcessStats } from '@/types'

const WATCH_KEY = 'zporter-watchlist'

function loadWatchlist(): number[] {
  try { const s = localStorage.getItem(WATCH_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

function saveWatchlist(ports: number[]) {
  try { localStorage.setItem(WATCH_KEY, JSON.stringify(ports)) } catch {}
}

export function useMonitor(pollingInterval: number) {
  const [watchedPorts, setWatchedPorts] = useState<WatchedPort[]>([])
  const [watchlist, setWatchlist] = useState<number[]>(loadWatchlist)
  const watchedPortsRef = useRef<WatchedPort[]>([])

  useEffect(() => { watchedPortsRef.current = watchedPorts }, [watchedPorts])

  const poll = useCallback(async () => {
    const currentWatchlist = watchlist
    if (currentWatchlist.length === 0) return
    try {
      const portInfos: PortInfo[] = await invoke('list_ports', { ports: currentWatchlist, onlyListening: true })
      const updated: WatchedPort[] = await Promise.all(
        currentWatchlist.map(async (port) => {
          const info = portInfos.find(p => p.port === port)
          if (info) {
            let stats: ProcessStats | undefined
            try { stats = await invoke('get_process_stats', { pid: info.pid }) } catch {}
            return { port, status: 'active' as const, portInfo: info, stats, lastPid: info.pid }
          } else {
            const prev = watchedPortsRef.current.find(w => w.port === port)
            return {
              port, status: 'down' as const,
              lastSeen: prev?.status === 'active' ? Date.now() : prev?.lastSeen,
              lastPid: prev?.lastPid,
            }
          }
        })
      )
      setWatchedPorts(updated)
    } catch {}
  }, [watchlist])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, pollingInterval * 1000)
    return () => clearInterval(interval)
  }, [pollingInterval, poll])

  const addToWatchlist = useCallback((port: number) => {
    setWatchlist(prev => {
      if (prev.includes(port)) return prev
      const next = [...prev, port]
      saveWatchlist(next)
      return next
    })
  }, [])

  const removeFromWatchlist = useCallback((port: number) => {
    setWatchlist(prev => {
      const next = prev.filter(p => p !== port)
      saveWatchlist(next)
      return next
    })
    setWatchedPorts(prev => prev.filter(p => p.port !== port))
  }, [])

  return { watchedPorts, watchlist, addToWatchlist, removeFromWatchlist }
}
