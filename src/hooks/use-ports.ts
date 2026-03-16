import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { PortInfo, KillResult } from '@/types'

function parsePortInput(input: string): number[] {
  const ports: number[] = []
  const parts = input.split(',').map(p => p.trim())
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(p => parseInt(p.trim()))
      if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= 65535) {
        for (let port = start; port <= end; port++) ports.push(port)
      }
    } else {
      const port = parseInt(part)
      if (!isNaN(port) && port >= 1 && port <= 65535) ports.push(port)
    }
  }
  return [...new Set(ports)].sort((a, b) => a - b)
}

export function usePorts() {
  const [portData, setPortData] = useState<PortInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scanPorts = useCallback(async (input: string) => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const portNumbers = parsePortInput(input)
      if (portNumbers.length === 0) { setPortData([]); return }
      const result: PortInfo[] = await invoke('list_ports', { ports: portNumbers, onlyListening: true })
      setPortData(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const scanAllPorts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: PortInfo[] = await invoke('list_all_ports')
      setPortData(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const killProcess = useCallback(async (pid: number, force: boolean): Promise<KillResult> => {
    const result: KillResult = await invoke('kill_process', { pid, force })
    return result
  }, [])

  return { portData, loading, error, scanPorts, scanAllPorts, killProcess, setPortData }
}
