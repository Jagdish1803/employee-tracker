'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, employeeCodeToEmail, emailToEmployeeCode } from '@/lib/supabase'
import { employeeService } from '@/api'
import { Employee } from '@/types'
import { toast } from 'react-hot-toast'

interface AdminAuthState {
  user: User | null
  admin: Employee | null
  loading: boolean
  isAdmin: boolean
}

interface AdminAuthActions {
  signIn: (employeeCode: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (employeeCode: string) => Promise<{ success: boolean; error?: string }>
  refreshAdmin: () => Promise<void>
}

type AdminAuthContextType = AdminAuthState & AdminAuthActions

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminAuthProviderProps {
  children: React.ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = admin?.role === 'admin' || admin?.role === 'super_admin'

  const loadAdminData = useCallback(async () => {
    try {
      const userEmail = user?.email
      if (!userEmail) return

      const employeeCode = emailToEmployeeCode(userEmail)
      const response = await employeeService.getAll()

      if (response.data.success && response.data.data) {
        const employee = response.data.data.find((emp: Employee) => emp.employeeCode === employeeCode)
        // Only allow admin or super_admin roles to access admin panel
        if (employee && (employee.role === 'admin' || employee.role === 'super_admin')) {
          setAdmin(employee)
        } else {
          setAdmin(null)
          toast.error('Access denied. Admin privileges required.')
        }
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
      setAdmin(null)
    }
  }, [user])

  const refreshAdmin = async () => {
    if (user) {
      await loadAdminData()
    }
  }

  const signIn = async (employeeCode: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const email = employeeCodeToEmail(employeeCode)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        await loadAdminData()
        return { success: true }
      }

      return { success: false, error: 'Unknown error occurred' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setAdmin(null)
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error signing out')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (employeeCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = employeeCodeToEmail(employeeCode)
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await loadAdminData()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadAdminData()
        } else {
          setAdmin(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadAdminData])

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        admin,
        loading,
        isAdmin,
        signIn,
        signOut,
        resetPassword,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}