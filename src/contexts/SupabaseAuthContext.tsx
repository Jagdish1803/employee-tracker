'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, employeeCodeToEmail, emailToEmployeeCode } from '@/lib/supabase'
import { employeeService } from '@/api'
import { Employee } from '@/types'
import { toast } from 'sonner'

interface SupabaseAuthContextType {
  user: User | null
  employee: Employee | null
  session: Session | null
  loading: boolean
  signInWithCode: (employeeCode: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadEmployeeData(session.user)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadEmployeeData(session.user)
        } else {
          setEmployee(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadEmployeeData = async (user: User) => {
    try {
      // Extract employee code from email
      const employeeCode = emailToEmployeeCode(user.email!)

      // Find employee in database
      const response = await employeeService.getAll()
      if (response.data.success) {
        const employeeData = response.data.data?.find(
          emp => emp.employeeCode === employeeCode
        )

        if (employeeData) {
          setEmployee(employeeData)
        } else {
          console.error('Employee not found in database:', employeeCode)
          toast.error('Employee data not found. Please contact administrator.')
        }
      }
    } catch (error) {
      console.error('Error loading employee data:', error)
      toast.error('Failed to load employee data')
    }
  }

  const signInWithCode = async (employeeCode: string) => {
    try {
      setLoading(true)

      // First, validate that employee code exists in our database
      const response = await employeeService.getAll()
      if (!response.data.success) {
        return { success: false, error: 'Failed to validate employee code' }
      }

      const employeeExists = response.data.data?.some(
        emp => emp.employeeCode === employeeCode
      )

      if (!employeeExists) {
        return { success: false, error: 'Invalid employee code. Please contact administrator.' }
      }

      // Convert employee code to email format
      const email = employeeCodeToEmail(employeeCode)

      // For employees, use a simple password (since they don't need to remember it)
      const simplePassword = `${employeeCode.toLowerCase()}123`

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: simplePassword
      })

      if (!signInError) {
        return { success: true }
      }

      // If sign in failed, try to sign up
      const { error } = await supabase.auth.signUp({
        email,
        password: simplePassword,
        options: {
          data: {
            employee_code: employeeCode,
            display_name: employeeCode
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
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
      setEmployee(null)
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    employee,
    session,
    loading,
    signInWithCode,
    signOut
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}