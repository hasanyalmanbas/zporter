interface StatCardProps {
  label: string
  value: number
  color?: string
  subtitle?: string
}

export function StatCard({ label, value, color = 'text-fg', subtitle }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-md p-3">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        {subtitle && <span className="text-status-active text-[10px]">{subtitle}</span>}
      </div>
    </div>
  )
}
