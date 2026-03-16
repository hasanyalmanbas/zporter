import { useState } from 'react'
import { FavoriteGroup } from '@/components/favorites/favorite-group'
import { QuickCommand } from '@/components/favorites/quick-command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { invoke } from '@tauri-apps/api/core'
import type { FavoriteGroup as FavoriteGroupType, FavoritePort, QuickCommand as QuickCommandType, HistoryEntry } from '@/types'

interface FavoritesPageProps {
  groups: FavoriteGroupType[]
  commands: QuickCommandType[]
  onAddGroup: (name: string) => void
  onRemoveGroup: (id: string) => void
  onAddPort: (groupId: string, port: FavoritePort) => void
  onRemovePort: (groupId: string, port: number) => void
  onAddCommand: (cmd: Omit<QuickCommandType, 'id'>) => void
  onRemoveCommand: (id: string) => void
  onAddHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
}

export function FavoritesPage({ groups, commands, onAddGroup, onRemovePort, onRemoveCommand, onAddPort, onAddHistoryEntry }: FavoritesPageProps) {
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showAddPort, setShowAddPort] = useState<string | null>(null)
  const [newPort, setNewPort] = useState('')
  const [newPortLabel, setNewPortLabel] = useState('')

  const handleScan = async (port: number) => {
    await invoke('list_ports', { ports: [port], onlyListening: true })
    onAddHistoryEntry({ action: 'scan', ports: [port] })
  }
  const handleKill = async (port: number) => {
    await invoke('kill_by_port', { port, force: false })
    onAddHistoryEntry({ action: 'kill', ports: [port] })
  }
  const handleExecuteCommand = async (cmd: QuickCommandType) => {
    if (cmd.action === 'scan') {
      await invoke('list_ports', { ports: cmd.ports, onlyListening: true })
      onAddHistoryEntry({ action: 'scan', ports: cmd.ports })
    } else {
      for (const port of cmd.ports) { await invoke('kill_by_port', { port, force: false }) }
      onAddHistoryEntry({ action: 'kill', ports: cmd.ports })
    }
  }
  const handleAddGroup = () => {
    if (newGroupName.trim()) { onAddGroup(newGroupName.trim()); setNewGroupName(''); setShowAddGroup(false) }
  }
  const handleAddPort = () => {
    const portNum = parseInt(newPort)
    if (showAddPort && !isNaN(portNum) && portNum >= 1 && portNum <= 65535) {
      onAddPort(showAddPort, { port: portNum, label: newPortLabel || `Port ${portNum}`, groupId: showAddPort })
      setNewPort(''); setNewPortLabel(''); setShowAddPort(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80">
        <span className="text-fg text-xs font-semibold">Favorites</span>
        <span className="flex-1" />
        <button onClick={() => setShowAddGroup(true)} className="bg-muted border border-input-border text-fg px-2.5 py-1 rounded-md text-[10px]">+ Add Group</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {groups.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-fg text-xs">No favorites yet. Create a group to get started.</div>
        )}
        {groups.map(group => (
          <div key={group.id}>
            <FavoriteGroup group={group} onScan={handleScan} onKill={handleKill} onRemovePort={onRemovePort} />
            <button onClick={() => setShowAddPort(group.id)} className="text-muted-fg text-[10px] hover:text-fg mb-4">+ Add port to {group.name}</button>
          </div>
        ))}
        {commands.length > 0 && (
          <>
            <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2 mt-4">Quick Commands</div>
            <div className="space-y-1">
              {commands.map(cmd => (<QuickCommand key={cmd.id} command={cmd} onExecute={handleExecuteCommand} onRemove={onRemoveCommand} />))}
            </div>
          </>
        )}
      </div>
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">New Group</DialogTitle></DialogHeader>
          <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none mt-2" />
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowAddGroup(false)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={handleAddGroup} className="bg-accent text-accent-fg px-3 py-1.5 rounded text-xs">Create</button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!showAddPort} onOpenChange={() => setShowAddPort(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Add Port</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            <input value={newPort} onChange={e => setNewPort(e.target.value)} placeholder="Port number" type="number" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none" />
            <input value={newPortLabel} onChange={e => setNewPortLabel(e.target.value)} placeholder="Label (optional)" className="w-full bg-muted border border-input-border rounded-md px-2.5 py-1.5 text-xs text-fg outline-none" />
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowAddPort(null)} className="text-muted-fg border border-border px-3 py-1.5 rounded text-xs">Cancel</button>
            <button onClick={handleAddPort} className="bg-accent text-accent-fg px-3 py-1.5 rounded text-xs">Add</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
