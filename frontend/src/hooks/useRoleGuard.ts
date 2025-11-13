'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, type UserRole } from '@/contexts/AuthContext'

/**
 * Hook to protect routes based on user role
 * Redirects users who don't have the required role
 */
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        // Redirect based on user role
        if (user.role === 'STAFF') {
          router.push('/pos')
        } else {
          router.push('/dashboard')
        }
      }
    }
  }, [user, loading, router, allowedRoles])

  return { user, loading, hasAccess: user ? allowedRoles.includes(user.role) : false }
}
