import type { Page } from '@/types'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppLayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto pb-14 sm:pb-0">
        {children}
      </main>
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  )
}
