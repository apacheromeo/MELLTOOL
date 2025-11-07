'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface SubMenuItem {
  name: string
  nameTh: string
  href: string
}

interface MenuItem {
  name: string
  nameTh: string
  href: string
  icon: React.ReactNode
  subItems?: SubMenuItem[]
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
    }
  }


  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      nameTh: 'แดชบอร์ด',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Inventory',
      nameTh: 'คลังสินค้า',
      href: '/inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      subItems: [
        { name: 'All Products', nameTh: 'สินค้าทั้งหมด', href: '/inventory' },
        { name: 'Categories', nameTh: 'หมวดหมู่', href: '/inventory/categories' },
        { name: 'Brands', nameTh: 'แบรนด์', href: '/inventory/brands' },
        { name: 'Low Stock Alert', nameTh: 'แจ้งเตือนสต็อกต่ำ', href: '/inventory/low-stock' },
        { name: 'Stock Adjustment', nameTh: 'ปรับสต็อก', href: '/inventory/adjustment' },
        { name: 'Barcode Generator', nameTh: 'สร้างบาร์โค้ด', href: '/inventory/barcode' },
      ]
    },
        {
          name: 'Stock In',
          nameTh: 'รับสินค้า',
          href: '/stock-in',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          ),
          subItems: [
            { name: 'All Stock-Ins', nameTh: 'รับสินค้าทั้งหมด', href: '/stock-in' },
            { name: 'Suppliers', nameTh: 'ซัพพลายเออร์', href: '/stock-in/suppliers' },
            { name: 'Purchase Orders', nameTh: 'ใบสั่งซื้อ', href: '/stock-in/purchase-orders' },
          ]
        },
    {
      name: 'Sales / POS',
      nameTh: 'ขายสินค้า',
      href: '/sales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      subItems: [
        { name: 'iPad POS (New)', nameTh: 'จุดขาย iPad', href: '/pos' },
        { name: 'Desktop POS', nameTh: 'จุดขายเดสก์ท็อป', href: '/sales' },
        { name: 'Sales Orders', nameTh: 'คำสั่งขาย', href: '/sales/orders' },
        { name: 'Sales History', nameTh: 'ประวัติการขาย', href: '/sales/history' },
        { name: 'Daily Reports', nameTh: 'รายงานรายวัน', href: '/sales/reports' },
        { name: 'Customers', nameTh: 'ลูกค้า', href: '/sales/customers' },
      ]
    },
    {
      name: 'AI Forecasting',
      nameTh: 'พยากรณ์ AI',
      href: '/forecasting',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      subItems: [
        { name: 'Dashboard', nameTh: 'แดชบอร์ด', href: '/forecasting' },
        { name: 'Stock Predictions', nameTh: 'ทำนายสต็อก', href: '/forecasting/predictions' },
        { name: 'Promotion Forecasts', nameTh: 'พยากรณ์โปรโมชั่น', href: '/forecasting/promotions' },
        { name: 'Reorder Points', nameTh: 'จุดสั่งซื้อใหม่', href: '/forecasting/reorder' },
        { name: 'ABC Analysis', nameTh: 'วิเคราะห์ ABC', href: '/forecasting/abc-analysis' },
        { name: 'Trend Analysis', nameTh: 'วิเคราะห์แนวโน้ม', href: '/forecasting/trends' },
      ]
    },
    {
      name: 'Accounting',
      nameTh: 'บัญชี',
      href: '/accounting',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      subItems: [
        { name: 'Dashboard', nameTh: 'แดชบอร์ด', href: '/accounting' },
        { name: 'Expenses', nameTh: 'ค่าใช้จ่าย', href: '/accounting/expenses' },
        { name: 'Income', nameTh: 'รายได้', href: '/accounting/income' },
        { name: 'Financial Reports', nameTh: 'รายงานการเงิน', href: '/accounting/reports' },
        { name: 'Profit & Loss', nameTh: 'กำไรขาดทุน', href: '/accounting/reports/profit-loss' },
        { name: 'Cash Flow', nameTh: 'กระแสเงินสด', href: '/accounting/reports/cash-flow' },
        { name: 'Tax Reports', nameTh: 'รายงานภาษี', href: '/accounting/tax' },
      ]
    },
    {
      name: 'Settings',
      nameTh: 'ตั้งค่า',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      subItems: [
        { name: 'General Settings', nameTh: 'ตั้งค่าทั่วไป', href: '/settings' },
        { name: 'User Management', nameTh: 'จัดการผู้ใช้', href: '/settings/users' },
        { name: 'Roles & Permissions', nameTh: 'บทบาทและสิทธิ์', href: '/settings/roles' },
        { name: 'Shopee Integration', nameTh: 'เชื่อมต่อ Shopee', href: '/settings/shopee' },
        { name: 'Payment Methods', nameTh: 'วิธีการชำระเงิน', href: '/settings/payment-methods' },
        { name: 'Notifications', nameTh: 'การแจ้งเตือน', href: '/settings/notifications' },
        { name: 'Backup & Restore', nameTh: 'สำรองและกู้คืน', href: '/settings/backup' },
      ]
    }
  ]

  // Auto-expand menu when on a sub-page
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(subItem => pathname === subItem.href)
        if (hasActiveSubItem && !expandedMenus.includes(item.name)) {
          setExpandedMenus(prev => [...prev, item.name])
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName)

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-white via-gray-50 to-white border-r border-gray-200 shadow-2xl transition-all duration-300 z-40 overflow-y-auto ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">StockFlow</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = isMenuExpanded(item.name)

            return (
              <div key={item.href}>
                {/* Main Menu Item */}
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group cursor-pointer ${
                    active && !hasSubItems
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'text-gray-700 hover:bg-white hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.name)
                    } else {
                      router.push(item.href)
                    }
                  }}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={active && !hasSubItems ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${active && !hasSubItems ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </div>
                        <div className={`text-xs ${active && !hasSubItems ? 'text-blue-100' : 'text-gray-500'}`}>
                          {item.nameTh}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && hasSubItems && (
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      } ${active && !hasSubItems ? 'text-white' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {/* Sub Menu Items */}
                {!isCollapsed && hasSubItems && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                    {item.subItems!.map((subItem) => {
                      const subActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            subActive
                              ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div>{subItem.name}</div>
                          <div className="text-xs text-gray-500">{subItem.nameTh}</div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile Section */}
        {!isCollapsed && user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-50 transition group"
                title="Logout"
              >
                <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed User Profile */}
        {isCollapsed && user && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
            <button
              onClick={handleLogout}
              className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-300 transition"
              title={`${user.name} - Click to logout`}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsCollapsed(true)} />
    </>
  )
}
