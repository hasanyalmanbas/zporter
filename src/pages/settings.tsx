import { AppearanceSection } from '@/components/settings/appearance-section'
import { BehaviorSection } from '@/components/settings/behavior-section'
import type { Settings, ThemeMode, KillMode } from '@/types'

interface SettingsPageProps {
  settings: Settings
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export function SettingsPage({ settings, onUpdateSetting }: SettingsPageProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      <div className="text-fg text-sm font-semibold mb-4">Settings</div>
      <AppearanceSection
        theme={settings.theme} compactMode={settings.compactMode}
        onThemeChange={(t: ThemeMode) => onUpdateSetting('theme', t)}
        onCompactChange={(c: boolean) => onUpdateSetting('compactMode', c)}
      />
      <BehaviorSection
        confirmBeforeKill={settings.confirmBeforeKill} defaultKillMode={settings.defaultKillMode} pollingInterval={settings.pollingInterval}
        onConfirmChange={(c: boolean) => onUpdateSetting('confirmBeforeKill', c)}
        onKillModeChange={(m: KillMode) => onUpdateSetting('defaultKillMode', m)}
        onIntervalChange={(i: 1 | 5 | 10 | 30) => onUpdateSetting('pollingInterval', i)}
      />
      <div>
        <div className="text-muted-fg text-[9px] uppercase tracking-wider mb-2">About</div>
        <div className="bg-card border border-border rounded-md p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center font-bold text-accent-fg text-sm">Z</div>
            <div>
              <div className="text-fg text-xs font-semibold">zPorter <span className="text-muted-fg font-normal">v1.0.0</span></div>
              <div className="text-muted-fg text-[10px]">Cross-platform port & process manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
