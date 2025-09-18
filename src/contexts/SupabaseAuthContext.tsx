'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, employeeCodeToEmail, emailToEmployeeCode } from '@/lib/supabase'
import { employeeService } from '@/api'
import { Employee } from '@/types'
import { toast } from 'react-hot-toast'

interface SupabaseAuthContextType {
  user: User | null
  employee: Employee | null
  session: Session | null
  loading: boolean
  signUp: (employeeCode: string, password: string) => Promise<{ success: boolean; error?: string }>
  signIn: (employeeCode: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (employeeCode: string) => Promise<{ success: boolean; error?: string }>
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

  const signUp = async (employeeCode: string, password: string) => {
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

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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

      if (data.user && !data.session) {
        return {
          success: true,
          error: 'Please check your email for verification link (if email confirmation is enabled)'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (employeeCode: string, password: string) => {
    try {
      setLoading(true)

      // Convert employee code to email format
      const email = employeeCodeToEmail(employeeCode)

      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
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

  const resetPassword = async (employeeCode: string) => {
    try {
      const email = employeeCodeToEmail(employeeCode)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const value = {
    user,
    employee,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
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