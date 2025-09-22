'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { UnifiedEmployeeAuth } from './UnifiedEmployeeAuth'

interface EmployeeAuthGuardProps {
  children: React.ReactNode
}

export function EmployeeAuthGuard({ children }: EmployeeAuthGuardProps) {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <UnifiedEmployeeAuth />
  }

  return <>{children}</>
}