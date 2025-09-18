'use client'

import React from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { UnifiedAuth } from './UnifiedAuth'

interface UnifiedAuthGuardProps {
  children: React.ReactNode
}

export function UnifiedAuthGuard({ children }: UnifiedAuthGuardProps) {
  const { user, admin, loading, isAdmin } = useAdminAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // For admin routes
  if (!user || !admin || !isAdmin) {
    return <UnifiedAuth />
  }

  return <>{children}</>
}