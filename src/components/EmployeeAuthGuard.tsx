'use client';

import React, { useState } from 'react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface EmployeeAuthGuardProps {
  children: React.ReactNode;
}

export function EmployeeAuthGuard({ children }: EmployeeAuthGuardProps) {
  const { isAuthenticated, isLoading, login } = useEmployeeAuth();
  const [employeeCode, setEmployeeCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) return;

    setIsSubmitting(true);
    try {
      await login(employeeCode.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Employee Login</CardTitle>
            <p className="text-muted-foreground">Enter your employee code to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Enter your code (e.g., ZOOT1049)"
                  autoFocus
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !employeeCode.trim()}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}