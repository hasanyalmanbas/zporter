import { useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'

interface SearchBarProps {
  onScan: (input: string) => void
  onScanAll: () => void
  loading: boolean
}

export function SearchBar({ onScan, onScanAll, loading }: SearchBarProps) {
  const [input, setInput] = useState('')
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onScan(input) }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/80">
      <Search className="w-4 h-4 text-muted-fg shrink-0" />
      <div className="flex-1 flex items-center bg-muted border border-input-border rounded-md px-2.5 py-1.5">
        <span className="text-muted-fg text-xs mr-1">ports:</span>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="3000, 5432, 8000-8100" className="flex-1 bg-transparent text-fg text-xs outline-none placeholder:text-muted-fg/50" />
        <span className="text-muted-fg text-[10px] border border-border px-1 rounded hidden sm:block">⏎</span>
      </div>
      <button type="submit" disabled={loading || !input.trim()} className="bg-accent text-accent-fg px-3 py-1.5 rounded-md font-semibold text-[11px] disabled:opacity-50 flex items-center gap-1.5">
        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
        Scan
      </button>
      <button type="button" onClick={onScanAll} disabled={loading} className="bg-muted border border-input-border text-fg px-3 py-1.5 rounded-md text-[11px] disabled:opacity-50">
        All Ports
      </button>
    </form>
  )
}
