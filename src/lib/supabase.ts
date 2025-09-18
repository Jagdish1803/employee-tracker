import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to convert employee code to email format
export const employeeCodeToEmail = (employeeCode: string) => {
  return `${employeeCode.toLowerCase()}@employee.local`
}

// Helper function to extract employee code from email
export const emailToEmployeeCode = (email: string) => {
  return email.replace('@employee.local', '').toUpperCase()
}