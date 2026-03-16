import { cn } from '@/lib/utils'

interface FilterBarProps {
  resultCount: number
  protocolFilter: 'all' | 'tcp' | 'udp'
  onProtocolChange: (f: 'all' | 'tcp' | 'udp') => void
}

export function FilterBar({ resultCount, protocolFilter, onProtocolChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-bg text-[11px]">
      <span className="text-accent font-semibold">{resultCount} results</span>
      <span className="text-border">│</span>
      <span className="text-muted-fg">Protocol:</span>
      {(['all', 'tcp', 'udp'] as const).map(p => (
        <button key={p} onClick={() => onProtocolChange(p)} className={cn(
          'px-1.5 py-0.5 rounded',
          protocolFilter === p ? 'text-accent bg-accent/15' : 'text-muted-fg hover:text-fg'
        )}>
          {p === 'all' ? 'All' : p.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
