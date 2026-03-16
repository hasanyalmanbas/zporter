import { useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '@/types'

const SETTINGS_KEY = 'zporter-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, updateSetting }
}
