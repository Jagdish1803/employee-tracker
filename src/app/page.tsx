
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Shield } from 'lucide-react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function HomePage() {
  const router = useRouter();

  const handleEmployeeLogin = () => {
    router.push('/employee');
  };

  const handleAdminLogin = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Employee Tracker</h1>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
          <SignedOut>
            <p className="text-xl text-gray-600 mb-6">Please sign in to access the system</p>
            <div className="flex justify-center gap-4 mb-8">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button variant="outline">Sign Up</Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <p className="text-xl text-gray-600">Choose your portal to access the system</p>
          </SignedIn>
        </div>

        <SignedIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Employee Portal Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleEmployeeLogin}>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Employee Portal</CardTitle>
              <CardDescription>
                Access your personal dashboard and work tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Simple login with employee code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>No password required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Track work and manage tasks</span>
                </div>
              </div>
              <Button className="w-full" onClick={handleEmployeeLogin}>
                Access Employee Portal
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200" onClick={handleAdminLogin}>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
              <CardDescription>
                Administrative access for system management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Full system access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Secure login required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Manage employees and settings</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={handleAdminLogin}
              >
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
          </div>
        </SignedIn>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}