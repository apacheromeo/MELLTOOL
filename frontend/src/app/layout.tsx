import type { Metadata } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import LoadingBar from '@/components/LoadingBar'

// Fonts optimized for both English and Thai
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['thai', 'latin'],
  variable: '--font-noto-thai',
  display: 'swap'
})

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
      <body className={`${inter.variable} ${notoSansThai.variable} font-sans`}>
        <LoadingBar />
        {children}
      </body>
    </html>
  )
}
