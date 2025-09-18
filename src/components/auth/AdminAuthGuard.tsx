'use client'

import React from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminAuth } from './AdminAuth'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, admin, loading, isAdmin } = useAdminAuth()

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

  if (!user || !admin || !isAdmin) {
    return <AdminAuth />
  }

  return <>{children}</>
}