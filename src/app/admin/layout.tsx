import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Portal - Only Bangers',
  description: 'Only Bangers Admin Dashboard',
  robots: 'noindex, nofollow', // Prevent search engines from indexing admin pages
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        background: '#0a0a0a',
      }}
    >
        {children}
    </section>
  )
}
