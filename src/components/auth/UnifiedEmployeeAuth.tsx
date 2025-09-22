'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, ArrowLeft } from 'lucide-react'
import { SignInButton } from '@clerk/nextjs'

export function UnifiedEmployeeAuth() {
  const router = useRouter()

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
            Sign in to access your employee dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal">
            <Button className="w-full">
              Sign In to Employee Portal
            </Button>
          </SignInButton>
        </CardContent>
      </Card>
    </div>
  )
}