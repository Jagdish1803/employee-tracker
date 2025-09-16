// src/app/employee/breaks/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Coffee, AlertTriangle, LogOut, Calendar, Play, Pause } from 'lucide-react';
import { employeeService } from '@/api';
import { Break, Employee } from '@/types';
import { getCurrentISTDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreakManagement } from '@/hooks/useBreaks';

export default function BreaksPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [breakDuration, setBreakDuration] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  // Use React Query for break management
  const {
    todayBreaks,
    activeBreaks,
    breaks: breakHistory,
    isLoading: loading,
    breakIn,
    breakOut
  } = useBreakManagement({ date: getCurrentISTDate() });

  // Get current active break for this employee
  const currentBreak = activeBreaks.find((breakRecord: Break) => 
    breakRecord.employeeId === employee?.id
  ) || null;

  // Calculate break summary
  const breakSummary = {
    totalBreaks: todayBreaks.length,
    totalMinutes: todayBreaks.reduce((total: number, breakRecord: Break) => {
      if (breakRecord.breakOutTime && breakRecord.breakInTime) {
        const duration = new Date(breakRecord.breakOutTime).getTime() - new Date(breakRecord.breakInTime).getTime();
        return total + Math.floor(duration / (1000 * 60));
      }
      return total;
    }, 0),
    avgMinutes: todayBreaks.length > 0 ? Math.floor(
      todayBreaks.reduce((total: number, breakRecord: Break) => {
        if (breakRecord.breakOutTime && breakRecord.breakInTime) {
          const duration = new Date(breakRecord.breakOutTime).getTime() - new Date(breakRecord.breakInTime).getTime();
          return total + Math.floor(duration / (1000 * 60));
        }
        return total;
      }, 0) / todayBreaks.filter((breakRecord: Break) => breakRecord.breakOutTime).length
    ) : 0
  };

  useEffect(() => {
    // Check if employee is already logged in
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      try {
        const emp = JSON.parse(savedEmployee);
        setEmployee(emp);
        setIsLoggedIn(true);
        // React Query will automatically load data when employee is set
      } catch {
        localStorage.removeItem('employee');
      }
    }
  }, []);

  // Timer for active break
  useEffect(() => {
    if (currentBreak?.isActive && currentBreak.breakInTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const breakStart = new Date(currentBreak.breakInTime!);
        const diffInMinutes = Math.floor((now.getTime() - breakStart.getTime()) / (1000 * 60));
        setBreakDuration(diffInMinutes);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentBreak]);

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
        // React Query will automatically load data when employee is set
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
    localStorage.removeItem('employee');
    toast.success('Logged out successfully');
  };

  // React Query handles data loading automatically

  const handleBreakIn = async () => {
    if (!employee) return;

    setActionLoading(true);
    try {
      await breakIn({ employeeId: employee.id });
      toast.success('Break started');
      // React Query will automatically refetch and update data
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to start break';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakOut = async () => {
    if (!employee) return;

    setActionLoading(true);
    try {
      await breakOut({ employeeId: employee.id });
      setBreakDuration(0);
      toast.success('Break ended');
      // React Query will automatically refetch and update data
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to end break';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const isExceeded = breakDuration > 20;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBreakTime = todayBreaks.reduce((total, breakItem) => total + breakItem.breakDuration, 0);

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
              <h1 className="text-2xl font-bold text-gray-900">Break Tracker</h1>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Break Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coffee className="h-5 w-5 mr-2" />
              Break Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              {currentBreak?.isActive ? (
                <div>
                  <div className="mb-4">
                    <div className="text-6xl font-bold text-blue-600 mb-2">
                      {Math.floor(breakDuration / 60)}:{(breakDuration % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-gray-600">
                      Break started at {formatTime(currentBreak.breakInTime!)}
                    </p>
                    {isExceeded && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-red-700 font-medium">
                            Break exceeded 20 minutes!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleBreakOut}
                    disabled={actionLoading}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Ending Break...' : 'End Break'}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">You are not currently on a break</p>
                  </div>
                  <Button
                    onClick={handleBreakIn}
                    disabled={actionLoading}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Starting Break...' : 'Start Break'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Break Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today&apos;s Break Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{breakSummary.totalBreaks}</div>
                <p className="text-gray-600">Total Breaks</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{breakSummary.totalMinutes}</div>
                <p className="text-gray-600">Total Minutes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {breakSummary.totalBreaks > 0 ? Math.round(breakSummary.totalMinutes / breakSummary.totalBreaks) : 0}
                </div>
                <p className="text-gray-600">Avg Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Break History */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Break History</CardTitle>
          </CardHeader>
          <CardContent>
            {breakHistory.length === 0 ? (
              <div className="text-center py-8">
                <Coffee className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No breaks today</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Start your first break when you&apos;re ready.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {breakHistory.map((breakItem, index) => (
                  <div
                    key={breakItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {formatTime(breakItem.breakInTime!)} - {breakItem.breakOutTime ? formatTime(breakItem.breakOutTime) : 'Active'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Duration: {breakItem.breakDuration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {breakItem.breakDuration > 20 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Exceeded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}