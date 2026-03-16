import { useState, useCallback } from 'react'
import type { FavoriteGroup, FavoritePort, QuickCommand } from '@/types'

const FAVS_KEY = 'zporter-favorites'
const CMDS_KEY = 'zporter-quick-commands'

function loadGroups(): FavoriteGroup[] {
  try { const s = localStorage.getItem(FAVS_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

function loadCommands(): QuickCommand[] {
  try { const s = localStorage.getItem(CMDS_KEY); if (s) return JSON.parse(s) } catch {}
  return []
}

export function useFavorites() {
  const [groups, setGroups] = useState<FavoriteGroup[]>(loadGroups)
  const [commands, setCommands] = useState<QuickCommand[]>(loadCommands)

  const saveGroups = (g: FavoriteGroup[]) => {
    setGroups(g)
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(g)) } catch {}
  }

  const addGroup = useCallback((name: string) => {
    saveGroups([...groups, { id: crypto.randomUUID(), name, ports: [] }])
  }, [groups])

  const removeGroup = useCallback((id: string) => {
    saveGroups(groups.filter(g => g.id !== id))
  }, [groups])

  const addPort = useCallback((groupId: string, port: FavoritePort) => {
    saveGroups(groups.map(g => g.id === groupId ? { ...g, ports: [...g.ports, port] } : g))
  }, [groups])

  const removePort = useCallback((groupId: string, port: number) => {
    saveGroups(groups.map(g => g.id === groupId ? { ...g, ports: g.ports.filter(p => p.port !== port) } : g))
  }, [groups])

  const addCommand = useCallback((cmd: Omit<QuickCommand, 'id'>) => {
    const next = [...commands, { ...cmd, id: crypto.randomUUID() }]
    setCommands(next)
    try { localStorage.setItem(CMDS_KEY, JSON.stringify(next)) } catch {}
  }, [commands])

  const removeCommand = useCallback((id: string) => {
    const next = commands.filter(c => c.id !== id)
    setCommands(next)
    try { localStorage.setItem(CMDS_KEY, JSON.stringify(next)) } catch {}
  }, [commands])

  return { groups, commands, addGroup, removeGroup, addPort, removePort, addCommand, removeCommand }
}
