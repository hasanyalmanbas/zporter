import type { FavoriteGroup as FavoriteGroupType } from '@/types'
import { FavoriteCard } from './favorite-card'

interface FavoriteGroupProps {
  group: FavoriteGroupType
  onScan: (port: number) => void
  onKill: (port: number) => void
  onRemovePort: (groupId: string, port: number) => void
}

export function FavoriteGroup({ group, onScan, onKill, onRemovePort }: FavoriteGroupProps) {
  return (
    <div className="mb-4">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">{group.name}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {group.ports.map(port => (
          <FavoriteCard key={port.port} port={port} onScan={onScan} onKill={onKill} onRemove={(p) => onRemovePort(group.id, p)} />
        ))}
      </div>
    </div>
  )
}
