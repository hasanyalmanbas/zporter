import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/types'

interface AppearanceSectionProps {
  theme: ThemeMode
  compactMode: boolean
  onThemeChange: (t: ThemeMode) => void
  onCompactChange: (c: boolean) => void
}

export function AppearanceSection({ theme, compactMode, onThemeChange, onCompactChange }: AppearanceSectionProps) {
  return (
    <div className="mb-5">
      <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">Appearance</div>
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <div className="text-fg text-xs">Theme</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Follow system preference or choose manually</div>
          </div>
          <div className="flex bg-muted border border-input-border rounded-md overflow-hidden">
            {(['system', 'light', 'dark'] as const).map(t => (
              <button key={t} onClick={() => onThemeChange(t)} className={cn(
                'px-2.5 py-1 text-[10px] capitalize',
                theme === t ? 'text-accent bg-accent/15' : 'text-muted-fg'
              )}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div className="text-fg text-xs">Compact Mode</div>
            <div className="text-muted-fg text-[10px] mt-0.5">Reduce spacing for more data density</div>
          </div>
          <button onClick={() => onCompactChange(!compactMode)} className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            compactMode ? 'bg-accent' : 'bg-border'
          )}>
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all',
              compactMode ? 'right-0.5 bg-white' : 'left-0.5 bg-muted-fg'
            )} />
          </button>
        </div>
      </div>
    </div>
  )
}
