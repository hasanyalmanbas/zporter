import { cn } from '@/lib/utils'
import type { PortInfo } from '@/types'
import { SourceBadge } from './source-badge'

interface ProcessTableProps {
  data: PortInfo[]
  selectedPids: Set<number>
  onToggleSelect: (pid: number) => void
  onToggleAll: () => void
  onKill: (pid: number, force: boolean) => void
  onDetails: (item: PortInfo) => void
}

export function ProcessTable({ data, selectedPids, onToggleSelect, onToggleAll, onKill, onDetails }: ProcessTableProps) {
  return (
    <div className="hidden lg:block flex-1 overflow-y-auto">
      <div className="flex items-center px-4 py-1.5 bg-card/50 border-b border-border text-[10px] uppercase tracking-wider text-muted-fg sticky top-0 z-10">
        <div className="w-6"><input type="checkbox" className="accent-accent" checked={selectedPids.size === data.length && data.length > 0} onChange={onToggleAll} /></div>
        <div className="w-16">Port</div>
        <div className="w-12">Proto</div>
        <div className="w-16">PID</div>
        <div className="flex-1">Command</div>
        <div className="w-20">User</div>
        <div className="w-20">Source</div>
        <div className="w-24 text-right">Actions</div>
      </div>
      {data.map(item => {
        const selected = selectedPids.has(item.pid)
        return (
          <div key={`${item.port}-${item.pid}-${item.protocol}`} className={cn(
            'flex items-center px-4 py-1 border-b border-border/50 text-xs hover:bg-hover transition-colors',
            selected && 'bg-accent/5 border-l-2 border-l-accent'
          )}>
            <div className="w-6"><input type="checkbox" className="accent-accent" checked={selected} onChange={() => onToggleSelect(item.pid)} /></div>
            <div className={cn('w-16 font-semibold', selected ? 'text-accent' : 'text-fg')}>{item.port}</div>
            <div className="w-12 text-muted-fg">{item.protocol.toUpperCase()}</div>
            <div className="w-16 text-source-node cursor-pointer">{item.pid}</div>
            <div className="flex-1 text-fg truncate">{item.process_name || item.exe_path}</div>
            <div className="w-20 text-muted-fg">{item.user}</div>
            <div className="w-20"><SourceBadge source={item.source} /></div>
            <div className="w-24 flex gap-1 justify-end">
              <button onClick={() => onKill(item.pid, false)} className="text-muted-fg border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-fg">⏻</button>
              <button onClick={() => onKill(item.pid, true)} className="text-destructive border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-destructive/80">✕</button>
              <button onClick={() => onDetails(item)} className="text-muted-fg border border-border px-1.5 py-0.5 rounded text-[10px] hover:text-fg">⋯</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
