import type { QuickCommand as QuickCommandType } from '@/types'

interface QuickCommandProps {
  command: QuickCommandType
  onExecute: (cmd: QuickCommandType) => void
  onRemove: (id: string) => void
}

export function QuickCommand({ command, onExecute, onRemove }: QuickCommandProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
      <button onClick={() => onExecute(command)} className="text-accent">&#x25B6;</button>
      <span className="text-fg text-[11px]">{command.label}</span>
      <span className="ml-auto text-muted-fg text-[10px]">{command.ports.join(', ')}</span>
      <button onClick={() => onRemove(command.id)} className="text-muted-fg text-[10px] hover:text-fg">&#x2715;</button>
    </div>
  )
}
