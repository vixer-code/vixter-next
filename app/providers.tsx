'use client'

import { SessionProvider } from 'next-auth/react'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { MessagingProvider } from '@/components/providers/MessagingProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <MessagingProvider>
          {children}
        </MessagingProvider>
      </NotificationProvider>
    </SessionProvider>
  )
}
