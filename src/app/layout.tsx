import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import ScrollToTop from '@/components/ScrollToTop'
import UniversalHeader from '@/components/AppHeader'
import UniversalFooter from '@/components/UniversalFooter'

export const metadata: Metadata = {
  title: 'Only Bangers',
  description: 'Premium haircuts and professional barber services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <UniversalHeader />
        <main>{children}</main>
        <UniversalFooter />
      </body>
    </html>
  )
}
