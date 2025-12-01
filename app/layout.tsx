import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HubSpot Support Tickets',
  description: 'Submit a support ticket to our HubSpot CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
