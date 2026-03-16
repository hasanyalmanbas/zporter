import { cn } from '@/lib/utils'

const SOURCE_COLORS: Record<string, string> = {
  docker: 'text-source-docker bg-source-docker/15',
  node: 'text-source-node bg-source-node/15',
  brew: 'text-source-brew bg-source-brew/15',
  systemd: 'text-source-systemd bg-source-systemd/15',
  launchd: 'text-source-launchd bg-source-launchd/15',
  unknown: 'text-source-unknown bg-source-unknown/15',
}

export function SourceBadge({ source }: { source: string }) {
  const colors = SOURCE_COLORS[source] || SOURCE_COLORS.unknown
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', colors)}>
      {source}
    </span>
  )
}
