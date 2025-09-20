'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Lock, KeyRound, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function UnifiedAuth() {
  const { signIn, resetPassword, loading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('login')

  // Login form state
  const [loginForm, setLoginForm] = useState({
    employeeCode: '',
    password: ''
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

    const employeeCode = loginForm.employeeCode.trim().toUpperCase()

    const result = await signIn(employeeCode, loginForm.password)

    if (result.success) {
      toast.success('Welcome to Admin Panel!')
    } else {
      toast.error(result.error || 'Login failed')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetForm.employeeCode.trim()) {
      toast.error('Please enter your admin code')
      return
    }

    const employeeCode = resetForm.employeeCode.trim().toUpperCase()

    const result = await resetPassword(employeeCode)

    if (result.success) {
      toast.success('Password reset email sent!')
      setActiveTab('login')
      setResetForm({ employeeCode: '' })
    } else {
      toast.error(result.error || 'Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-12 w-12 text-purple-600" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-slate-900">!</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Admin Panel</CardTitle>
          <CardDescription className="text-slate-600">
            Administrative access required
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 font-medium">Admin privileges required</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Admin Login</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginCode">Admin Code</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="loginCode"
                      type="text"
                      placeholder="Enter admin code"
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
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Access Admin Panel'}
                </Button>
              </form>
            </TabsContent>

            {/* Reset Password Tab */}
            <TabsContent value="reset" className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetCode">Admin Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetCode"
                      type="text"
                      placeholder="Enter admin code"
                      value={resetForm.employeeCode}
                      onChange={(e) => setResetForm(prev => ({ ...prev, employeeCode: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Reset link will be sent to your registered email
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-600 hover:bg-slate-700"
                  disabled={loading}
                >
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