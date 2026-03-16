import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/app-layout'
import { useTheme } from '@/hooks/use-theme'
import { useSettings } from '@/hooks/use-settings'
import { useHistory } from '@/hooks/use-history'
import { useFavorites } from '@/hooks/use-favorites'
import { useMonitor } from '@/hooks/use-monitor'
import { DashboardPage } from '@/pages/dashboard'
import { ScannerPage } from '@/pages/scanner'
import { MonitorPage } from '@/pages/monitor'
import { FavoritesPage } from '@/pages/favorites'
import { HistoryPage } from '@/pages/history'
import { SettingsPage } from '@/pages/settings'
import type { Page } from '@/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const theme = useTheme()
  const { settings, updateSetting } = useSettings()
  const { entries: historyEntries } = useHistory()
  const { commands: quickCommands } = useFavorites()
  const { watchedPorts } = useMonitor(settings.pollingInterval)

  if (settings.theme !== theme.mode) {
    theme.setMode(settings.theme)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            historyEntries={historyEntries}
            quickCommands={quickCommands}
            watchedPorts={watchedPorts}
            onNavigate={setCurrentPage}
            onExecuteCommand={() => {}}
          />
        )
      case 'scanner':
        return <ScannerPage settings={settings} />
      case 'monitor':
        return <MonitorPage settings={settings} />
      case 'favorites':
        return <FavoritesPage />
      case 'history':
        return <HistoryPage />
      case 'settings':
        return <SettingsPage settings={settings} onUpdateSetting={updateSetting} />
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
