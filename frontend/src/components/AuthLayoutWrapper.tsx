'use client'

import { usePathname } from 'next/navigation'
import AppLayout from './AppLayout'

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/')

  return isAuthPage ? children : <AppLayout>{children}</AppLayout>
} 