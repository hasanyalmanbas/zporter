import type { QuickCommand } from '@/types'

interface QuickActionsProps {
  commands: QuickCommand[]
  onExecute: (cmd: QuickCommand) => void
}

export function QuickActions({ commands, onExecute }: QuickActionsProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Quick Actions</div>
      {commands.length === 0 ? (
        <div className="text-muted-fg text-[10px]">Add favorites to see quick actions here</div>
      ) : (
        <div className="space-y-1">
          {commands.slice(0, 3).map(cmd => (
            <button key={cmd.id} onClick={() => onExecute(cmd)} className="w-full flex items-center gap-2 px-2 py-1.5 bg-muted rounded text-left hover:bg-hover">
              <span className="text-accent">⌕</span>
              <span className="text-fg text-[11px]">{cmd.label}</span>
              <span className="ml-auto text-muted-fg text-[9px]">{cmd.ports.join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
