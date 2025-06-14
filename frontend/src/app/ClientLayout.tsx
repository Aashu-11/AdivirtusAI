'use client'

import { useEffect, useState } from 'react'
import AuthLayoutWrapper from '@/components/AuthLayoutWrapper'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div className={mounted ? 'cz-shortcut-listen' : ''}>
        <ThemeProvider>
          <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
        </ThemeProvider>
      </div>
      <Analytics />
    </>
  )
} 