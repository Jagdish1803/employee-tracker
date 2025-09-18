'use client'

import React, { useState } from 'react'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Lock, UserPlus, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function EmployeeAuth() {
  const { signIn, signUp, resetPassword, loading } = useSupabaseAuth()
  const [activeTab, setActiveTab] = useState('login')

  // Login form state
  const [loginForm, setLoginForm] = useState({
    employeeCode: '',
    password: ''
  })

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    employeeCode: '',
    password: '',
    confirmPassword: ''
  })

  // Reset password form state
  const [resetForm, setResetForm] = useState({
    employeeCode: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginForm.employeeCode.trim() || !loginForm.password) {
      toast.error('Please fill in all fields')
      return
    }

    const result = await signIn(loginForm.employeeCode.trim().toUpperCase(), loginForm.password)

    if (result.success) {
      toast.success('Successfully logged in!')
    } else {
      toast.error(result.error || 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerForm.employeeCode.trim() || !registerForm.password || !registerForm.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    const result = await signUp(registerForm.employeeCode.trim().toUpperCase(), registerForm.password)

    if (result.success) {
      if (result.error) {
        toast.success(result.error) // This is the email verification message
      } else {
        toast.success('Account created successfully!')
      }
      setActiveTab('login')
      setRegisterForm({ employeeCode: '', password: '', confirmPassword: '' })
    } else {
      toast.error(result.error || 'Registration failed')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetForm.employeeCode.trim()) {
      toast.error('Please enter your employee code')
      return
    }

    const result = await resetPassword(resetForm.employeeCode.trim().toUpperCase())

    if (result.success) {
      toast.success('Password reset email sent! Check your email.')
      setActiveTab('login')
      setResetForm({ employeeCode: '' })
    } else {
      toast.error(result.error || 'Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Employee Portal</CardTitle>
          <CardDescription>
            Access your employee dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginCode">Employee Code</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="loginCode"
                      type="text"
                      placeholder="e.g., ZOOT1049"
                      value={loginForm.employeeCode}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, employeeCode: e.target.value }))}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="loginPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registerCode">Employee Code</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="registerCode"
                      type="text"
                      placeholder="e.g., ZOOT1049"
                      value={registerForm.employeeCode}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, employeeCode: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use your assigned employee code
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="registerPassword"
                      type="password"
                      placeholder="Create a strong password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            {/* Reset Password Tab */}
            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetCode">Employee Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetCode"
                      type="text"
                      placeholder="e.g., ZOOT1049"
                      value={resetForm.employeeCode}
                      onChange={(e) => setResetForm(prev => ({ ...prev, employeeCode: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We&apos;ll send a reset link to your registered email
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}