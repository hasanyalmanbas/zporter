import { cn } from '@/lib/utils'
import type { Page } from '@/types'
import { LayoutDashboard, Search, Radio, Star, MoreHorizontal } from 'lucide-react'

interface BottomNavProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const BOTTOM_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'scanner', label: 'Scan', icon: Search },
  { page: 'monitor', label: 'Monitor', icon: Radio },
  { page: 'favorites', label: 'Favs', icon: Star },
  { page: 'history', label: 'More', icon: MoreHorizontal },
]

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around py-2 z-50">
      {BOTTOM_ITEMS.map(({ page, label, icon: Icon }) => (
        <button key={page} onClick={() => onNavigate(page)} className={cn(
          'flex flex-col items-center gap-0.5 text-[9px]',
          currentPage === page ? 'text-accent' : 'text-muted-fg'
        )}>
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
