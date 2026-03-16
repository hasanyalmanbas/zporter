import { cn } from '@/lib/utils'
import type { Page } from '@/types'
import { LayoutDashboard, Search, Radio, Star, Clock, Settings } from 'lucide-react'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'scanner', label: 'Scanner', icon: Search },
  { page: 'monitor', label: 'Monitor', icon: Radio },
  { page: 'favorites', label: 'Favorites', icon: Star },
  { page: 'history', label: 'History', icon: Clock },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden sm:flex w-[220px] lg:w-[220px] sm:w-[44px] flex-col bg-card border-r border-border h-screen sticky top-0">
      <div className="flex items-center gap-2 p-3 lg:px-3 sm:justify-center lg:justify-start">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center font-bold text-accent-fg text-xs shrink-0">Z</div>
        <span className="text-fg font-semibold text-sm hidden lg:block">zPorter</span>
        <span className="text-muted-fg text-[10px] ml-auto hidden lg:block">v1.0</span>
      </div>
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        <div className="text-muted-fg text-[9px] uppercase tracking-wider px-2 mb-1 hidden lg:block">Navigation</div>
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
          <button key={page} onClick={() => onNavigate(page)} className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors',
            'sm:justify-center lg:justify-start',
            currentPage === page ? 'bg-accent/15 border border-accent/30 text-accent' : 'text-muted-fg hover:bg-hover hover:text-fg'
          )}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <button onClick={() => onNavigate('settings')} className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors',
          'sm:justify-center lg:justify-start',
          currentPage === 'settings' ? 'bg-accent/15 border border-accent/30 text-accent' : 'text-muted-fg hover:bg-hover hover:text-fg'
        )}>
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  )
}
