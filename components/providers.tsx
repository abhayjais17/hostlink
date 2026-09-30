'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

const AppearanceContext = createContext({ dark: false, setDark: (_dark: boolean) => {} })
export const useAppearance = () => useContext(AppearanceContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101820' : '#0F766E')
  }, [dark])
  return <AppearanceContext.Provider value={{ dark, setDark }}><MotionConfig reducedMotion="user" transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}>
    <TooltipProvider delay={150}>{children}<Toaster theme={dark ? 'dark' : 'light'} position="bottom-right" duration={4000} closeButton /></TooltipProvider>
  </MotionConfig></AppearanceContext.Provider>
}
