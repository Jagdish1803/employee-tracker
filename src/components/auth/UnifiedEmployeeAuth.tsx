'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function UnifiedEmployeeAuth() {
  const router = useRouter()
  const { login, isLoading } = useEmployeeAuth()
  const [employeeCode, setEmployeeCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeCode.trim()) {
      toast.error('Please enter your employee code')
      return
    }

    const success = await login(employeeCode.trim().toUpperCase())

    if (!success) {
      setEmployeeCode('') // Clear the input on failed login
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Employee Portal</CardTitle>
          <CardDescription>
            Enter your employee code to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee Code</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="employeeCode"
                  type="text"
                  placeholder="e.g., ZOOT1049"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500">
                Use your unique employee code assigned by the administrator
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Access Employee Portal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}