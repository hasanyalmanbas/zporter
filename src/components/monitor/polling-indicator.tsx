export function PollingIndicator({ interval }: { interval: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse" />
      <span className="text-muted-fg text-[10px]">Polling every {interval}s</span>
    </div>
  )
}
