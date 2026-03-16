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
  const history = useHistory()
  const favorites = useFavorites()
  const monitor = useMonitor(settings.pollingInterval)

  if (settings.theme !== theme.mode) {
    theme.setMode(settings.theme)
  }

  return (
    <TooltipProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        <div className={currentPage === 'dashboard' ? 'h-full' : 'hidden'}>
          <DashboardPage
            historyEntries={history.entries}
            quickCommands={favorites.commands}
            watchedPorts={monitor.watchedPorts}
            onNavigate={setCurrentPage}
            onExecuteCommand={() => {}}
          />
        </div>
        <div className={currentPage === 'scanner' ? 'h-full' : 'hidden'}>
          <ScannerPage settings={settings} onAddHistoryEntry={history.addEntry} />
        </div>
        <div className={currentPage === 'monitor' ? 'h-full' : 'hidden'}>
          <MonitorPage
            settings={settings}
            watchedPorts={monitor.watchedPorts}
            onAddToWatchlist={monitor.addToWatchlist}
            onRemoveFromWatchlist={monitor.removeFromWatchlist}
            onAddHistoryEntry={history.addEntry}
          />
        </div>
        <div className={currentPage === 'favorites' ? 'h-full' : 'hidden'}>
          <FavoritesPage
            groups={favorites.groups}
            commands={favorites.commands}
            onAddGroup={favorites.addGroup}
            onRemoveGroup={favorites.removeGroup}
            onAddPort={favorites.addPort}
            onRemovePort={favorites.removePort}
            onAddCommand={favorites.addCommand}
            onRemoveCommand={favorites.removeCommand}
            onAddHistoryEntry={history.addEntry}
          />
        </div>
        <div className={currentPage === 'history' ? 'h-full' : 'hidden'}>
          <HistoryPage entries={history.entries} onClearHistory={history.clearHistory} />
        </div>
        <div className={currentPage === 'settings' ? 'h-full' : 'hidden'}>
          <SettingsPage settings={settings} onUpdateSetting={updateSetting} />
        </div>
      </AppLayout>
    </TooltipProvider>
  )
}
