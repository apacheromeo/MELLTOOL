'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, type UserRole } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'

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
  roles?: UserRole[] // Optional roles that can access this menu item
}

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
    }
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])


  const allMenuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      nameTh: 'แดชบอร์ด',
      href: '/dashboard',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['OWNER', 'MOD'] // Only OWNER and MOD can access dashboard
    },
    {
      name: 'Inventory',
      nameTh: 'คลังสินค้า',
      href: '/inventory',
      roles: ['OWNER', 'MOD'], // OWNER and MOD only
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      roles: ['OWNER', 'MOD'], // OWNER and MOD only
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      roles: ['OWNER', 'MOD', 'STAFF'], // All roles can access POS
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      roles: ['OWNER', 'MOD'], // OWNER and MOD only
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      roles: ['OWNER'], // OWNER only
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      roles: ['OWNER', 'MOD'], // OWNER and MOD only
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    // If no user yet, don't show any items with role restrictions
    if (!user && item.roles) return false
    // If item has no role restriction, always show it
    if (!item.roles) return true
    // Otherwise check if user's role is included
    return user && item.roles.includes(user.role)
  })

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
      {/* Mobile Menu Toggle Button - Floating Bottom Right */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-white via-gray-50 to-white border-r border-gray-200 shadow-2xl transition-all duration-300 z-40 flex flex-col
        ${isCollapsed ? 'w-20 md:w-80 lg:w-20' : 'w-64 md:w-80 lg:w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 bg-white flex-shrink-0">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">StockFlow</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-gray-100 transition hidden lg:block touch-manipulation"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 md:p-4 space-y-1 md:space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = isMenuExpanded(item.name)

            return (
              <div key={item.href}>
                {/* Main Menu Item */}
                <div
                  className={`flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all duration-300 group cursor-pointer touch-manipulation ${
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
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className={`${active && !hasSubItems ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'} w-5 h-5 md:w-6 md:h-6 flex items-center justify-center`}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1">
                        <div className={`font-semibold text-sm md:text-base ${active && !hasSubItems ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </div>
                        <div className={`text-xs md:text-sm ${active && !hasSubItems ? 'text-blue-100' : 'text-gray-500'}`}>
                          {item.nameTh}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && hasSubItems && (
                    <svg
                      className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
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
                  <div className="ml-8 md:ml-10 mt-1 md:mt-2 space-y-1 md:space-y-1.5 animate-fade-in">
                    {item.subItems!.map((subItem) => {
                      const subActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base transition-all duration-200 touch-manipulation ${
                            subActive
                              ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 md:border-l-3 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div>{subItem.name}</div>
                          <div className="text-xs md:text-sm text-gray-500">{subItem.nameTh}</div>
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
          <div className="p-4 md:p-5 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base md:text-lg shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm md:text-base text-gray-900 truncate">{user.name}</div>
                <div className="text-xs md:text-sm text-gray-500">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 md:p-2.5 rounded-lg md:rounded-xl hover:bg-red-50 transition group touch-manipulation"
                title="Logout"
                aria-label="Logout"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed User Profile */}
        {isCollapsed && user && (
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-300 transition"
              title={`${user.name} - Click to logout`}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        )}

        {/* Login Button for Unauthenticated Users */}
        {!isCollapsed && !user && (
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In</span>
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">
              เข้าสู่ระบบ
            </p>
          </div>
        )}

        {/* Collapsed Login Button */}
        {isCollapsed && !user && (
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => router.push('/login')}
              className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white hover:ring-2 hover:ring-blue-300 transition shadow-lg"
              title="Sign In"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
