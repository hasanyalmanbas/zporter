import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { useTheme } from '@/hooks/use-theme'
import { useSettings } from '@/hooks/use-settings'
import { ScannerPage } from '@/pages/scanner'
import type { Page } from '@/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('scanner')
  const theme = useTheme()
  const { settings, updateSetting } = useSettings()

  if (settings.theme !== theme.mode) {
    theme.setMode(settings.theme)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'scanner':
        return <ScannerPage settings={settings} />
      case 'dashboard':
      case 'monitor':
      case 'favorites':
      case 'history':
        return (
          <div className="flex items-center justify-center h-full text-muted-fg">
            <p className="text-sm">{currentPage} — coming soon</p>
          </div>
        )
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-muted-fg">
            <p className="text-sm">Settings — coming soon</p>
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </AppLayout>
    </TooltipProvider>
  )
}
