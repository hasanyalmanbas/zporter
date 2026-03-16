import type { FavoritePort } from '@/types'

interface FavoriteCardProps {
  port: FavoritePort
  onScan: (port: number) => void
  onKill: (port: number) => void
  onRemove: (port: number) => void
}

export function FavoriteCard({ port, onScan, onKill, onRemove }: FavoriteCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold">:{port.port}</span>
          <span className="text-muted-fg text-[10px]">{port.label}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onScan(port.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px] hover:text-fg">&#x2315;</button>
        <button onClick={() => onKill(port.port)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">&#x2715;</button>
        <button onClick={() => onRemove(port.port)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px] hover:text-fg">&#x2014;</button>
      </div>
    </div>
  )
}
