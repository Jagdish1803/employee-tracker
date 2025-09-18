'use client'

import React from 'react'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { EmployeeAuth } from './EmployeeAuth'

interface SupabaseAuthGuardProps {
  children: React.ReactNode
}

export function SupabaseAuthGuard({ children }: SupabaseAuthGuardProps) {
  const { user, employee, loading } = useSupabaseAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !employee) {
    return <EmployeeAuth />
  }

  return <>{children}</>
}