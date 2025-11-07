import type { Metadata } from 'next'
import './globals.css'
import LoadingBar from '@/components/LoadingBar'

// NOTE: Google Fonts disabled for Codespaces compatibility
// Using system fonts as fallback for better performance and reliability
// Original fonts: Inter, Noto_Sans_Thai

export const metadata: Metadata = {
  title: 'StockFlow - Inventory Management System',
  description: 'Thai E-commerce Inventory Management with AI Forecasting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <LoadingBar />
        {children}
      </body>
    </html>
  )
}
