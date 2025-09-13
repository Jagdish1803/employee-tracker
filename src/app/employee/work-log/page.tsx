// src/app/employee/work-log/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { assignmentService, employeeService } from '@/api';
import { Assignment, Employee } from '@/types';
import { getCurrentISTDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkLogForm from '@/components/employee/WorkLogForm';

export default function WorkLogPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedDate] = useState(getCurrentISTDate()); // Locked to today's date
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if employee is already logged in (from localStorage)
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      try {
        const emp = JSON.parse(savedEmployee);
        setEmployee(emp);
        setIsLoggedIn(true);
        loadAssignments(emp.id);
      } catch {
        localStorage.removeItem('employee');
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      toast.error('Please enter your employee code');
      return;
    }

    setLoggingIn(true);
    try {
      const response = await employeeService.login(employeeCode.trim());
      if (response.data.success && response.data.data) {
        const emp = response.data.data;
        setEmployee(emp);
        setIsLoggedIn(true);
        localStorage.setItem('employee', JSON.stringify(emp));
        toast.success('Login successful!');
        loadAssignments(emp.id);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setEmployee(null);
    setIsLoggedIn(false);
    setEmployeeCode('');
    setAssignments([]);
    localStorage.removeItem('employee');
    toast.success('Logged out successfully');
  };

  const loadAssignments = async (employeeId: number) => {
    try {
      setLoading(true);
      const response = await assignmentService.getByEmployee(employeeId);
      if (response.data.success) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    toast.success('Work log submitted successfully!');
    // Could redirect to dashboard or reload data
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Employee Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Enter your employee code"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loggingIn || !employeeCode.trim()}
                className="w-full"
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Log</h1>
              <p className="text-sm text-gray-600">
                Welcome, {employee?.name} ({employee?.employeeCode})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/employee')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Work Log Form */}
        {employee && (
          <WorkLogForm
            employeeId={employee.id}
            selectedDate={selectedDate}
            assignments={assignments}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}
      </div>
    </div>
  );
}