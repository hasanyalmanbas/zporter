import type { PortInfo } from '@/types'
import { SourceBadge } from './source-badge'

interface ProcessCardProps {
  item: PortInfo
  onKill: (pid: number, force: boolean) => void
}

export function ProcessCard({ item, onKill }: ProcessCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">:{item.port}</span>
          <SourceBadge source={item.source} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onKill(item.pid, false)} className="text-muted-fg border border-border px-2 py-1 rounded text-[10px]">⏻</button>
          <button onClick={() => onKill(item.pid, true)} className="text-destructive border border-border px-2 py-1 rounded text-[10px]">✕</button>
        </div>
      </div>
      <div className="text-[10px] text-muted-fg">
        PID <span className="text-source-node">{item.pid}</span> · <span className="text-fg">{item.process_name}</span>
      </div>
      <div className="text-[10px] text-muted-fg">user: {item.user} · {item.protocol.toUpperCase()}</div>
    </div>
  )
}
