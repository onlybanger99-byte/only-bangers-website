import type { Metadata } from 'next'
import './globals.css'
import UniversalHeader from '@/components/UniversalHeader'   // adjust if path differs
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
        <UniversalHeader />
        <main>{children}</main>
        <UniversalFooter />
      </body>
    </html>
  )
}