import { useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '@/types'

const THEME_KEY = 'zporter-theme'

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function applyTheme(effective: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredTheme)
  const [effective, setEffective] = useState<'light' | 'dark'>(() => getEffectiveTheme(getStoredTheme()))

  const setMode = useCallback((newMode: ThemeMode) => {
    try { localStorage.setItem(THEME_KEY, newMode) } catch {}
    setModeState(newMode)
    const eff = getEffectiveTheme(newMode)
    setEffective(eff)
    applyTheme(eff)
  }, [])

  useEffect(() => {
    applyTheme(effective)
  }, [effective])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const eff = getEffectiveTheme('system')
      setEffective(eff)
      applyTheme(eff)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return { mode, effective, setMode }
}
