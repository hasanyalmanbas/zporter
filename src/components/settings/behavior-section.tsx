import { cn } from '@/lib/utils'
import type { KillMode } from '@/types'

interface BehaviorSectionProps {
  confirmBeforeKill: boolean
  defaultKillMode: KillMode
  pollingInterval: number
  onConfirmChange: (c: boolean) => void
  onKillModeChange: (m: KillMode) => void
  onIntervalChange: (i: 1 | 5 | 10 | 30) => void
}

export function BehaviorSection({ confirmBeforeKill, defaultKillMode, pollingInterval, onConfirmChange, onKillModeChange, onIntervalChange }: BehaviorSectionProps) {
  return (
    <div className="mb-5">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Behavior</div>
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Confirm before kill</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Show confirmation dialog before killing</div>
          </div>
          <button onClick={() => onConfirmChange(!confirmBeforeKill)} className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            confirmBeforeKill ? 'bg-accent' : 'bg-border'
          )}>
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all',
              confirmBeforeKill ? 'right-0.5 bg-white' : 'left-0.5 bg-muted-fg'
            )} />
          </button>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Default kill mode</div>
            <div className="text-muted-fg text-[10px] mt-0.5">How processes are terminated by default</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {(['graceful', 'force'] as const).map(m => (
              <button key={m} onClick={() => onKillModeChange(m)} className={cn(
                'px-2.5 py-1 text-[10px] capitalize',
                defaultKillMode === m ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{m}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div className="text-fg text-xs">Monitor polling interval</div>
            <div className="text-muted-fg text-[10px] mt-0.5">How often watched ports are checked</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {([1, 5, 10, 30] as const).map(i => (
              <button key={i} onClick={() => onIntervalChange(i)} className={cn(
                'px-2.5 py-1 text-[10px]',
                pollingInterval === i ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{i}s</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
