'use client'

import Sidebar from './Sidebar'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}



