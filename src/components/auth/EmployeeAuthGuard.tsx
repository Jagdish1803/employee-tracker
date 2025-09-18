'use client'

import React from 'react'
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext'
import { UnifiedEmployeeAuth } from './UnifiedEmployeeAuth'

interface EmployeeAuthGuardProps {
  children: React.ReactNode
}

export function EmployeeAuthGuard({ children }: EmployeeAuthGuardProps) {
  const { isAuthenticated, isLoading } = useEmployeeAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <UnifiedEmployeeAuth />
  }

  return <>{children}</>
}