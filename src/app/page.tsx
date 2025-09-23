
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has admin code TIPL1002 in their metadata, username, or email
      const isAdmin = user.publicMetadata?.adminCode === 'TIPL1002' ||
                     user.username?.toUpperCase() === 'TIPL1002' ||
                     user.emailAddresses?.[0]?.emailAddress.toUpperCase().includes('TIPL1002');

      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    }
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Employee Tracker</h1>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>

          <SignedOut>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome</h2>
                <p className="text-gray-600">Sign in to access your dashboard</p>
              </div>

              <div className="space-y-4">
                <SignInButton mode="modal">
                  <Button className="w-full" size="lg">
                    Sign In
                  </Button>
                </SignInButton>
              </div>

              <div className="mt-6 text-xs text-gray-500 text-center">
                <p>By signing in, you agree to our terms of service</p>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </SignedIn>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}