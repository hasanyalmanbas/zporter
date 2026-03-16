interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onKillSelected: () => void
}

export function BatchActionBar({ selectedCount, totalCount, onKillSelected }: BatchActionBarProps) {
  if (selectedCount === 0) return null
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-card/80 text-[11px]">
      <span className="text-accent">{selectedCount} selected</span>
      <span className="text-border">│</span>
      <button onClick={onKillSelected} className="text-muted-fg border border-border px-2.5 py-1 rounded hover:text-fg">Kill Selected</button>
      <span className="flex-1" />
      <span className="text-muted-fg">Showing 1-{totalCount} of {totalCount}</span>
    </div>
  )
}
