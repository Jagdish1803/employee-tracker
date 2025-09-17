'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Clock, Calendar, Coffee, FileText, BarChart3, 
  AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  logService, breakService, issueService, warningService, employeeService
} from '@/api';
import { Log, Break, Issue, Warning } from '@/types';
import { getCurrentISTDate, formatDateTime, formatMinutesToHours } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployeeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todayLogs: [] as Log[],
    currentBreak: null as Break | null,
    recentIssues: [] as Issue[],
    activeWarnings: [] as Warning[],
    weeklyStats: {
      totalMinutes: 0,
      daysWorked: 0,
      avgPerDay: 0,
    },
  });

  // Employee code login state
  const [employeeCode, setEmployeeCode] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const attemptLogin = useCallback(async (code: string) => {
    try {
      setLoginLoading(true);
      const response = await employeeService.login(code);

      if (response.data.success && response.data.data) {
        setEmployeeId(response.data.data.id);
        setLoggedIn(true);
        toast.success('Login successful');
      } else {
        toast.error('Invalid employee code');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid employee code');
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const handleAutoLogin = useCallback(async (code: string) => {
    await attemptLogin(code);
  }, [attemptLogin]);

  // Update current date/time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check for code in URL parameters first
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !loggedIn) {
      setEmployeeCode(codeFromUrl);
      handleAutoLogin(codeFromUrl);
    }
  }, [searchParams, handleAutoLogin, loggedIn]);

  useEffect(() => {
    if (loggedIn && employeeId) {
      loadDashboardData(employeeId);
    }
  }, [loggedIn, employeeId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      toast.error('Please enter your employee code');
      return;
    }
    await attemptLogin(employeeCode.trim());
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmployeeId(null);
    setEmployeeCode('');
    setDashboardData({
      todayLogs: [],
      currentBreak: null,
      recentIssues: [],
      activeWarnings: [],
      weeklyStats: {
        totalMinutes: 0,
        daysWorked: 0,
        avgPerDay: 0,
      },
    });
    router.push('/');
  };

  const loadDashboardData = async (employeeId: number) => {
    try {
      setLoading(true);
      const today = getCurrentISTDate();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Load all dashboard data
      try {
        const [
          logsResponse,
          breakStatusResponse,
          issuesResponse,
          warningsResponse
        ] = await Promise.all([
          logService.getByDate(employeeId, today),
          breakService.getStatus(employeeId),
          issueService.getByEmployee(employeeId),
          warningService.getByEmployee(employeeId)
        ]);

        setDashboardData({
          todayLogs: Array.isArray(logsResponse) ? logsResponse as Log[] : [],
          currentBreak: breakStatusResponse as Break | null ?? null,
          recentIssues: issuesResponse.data.success ?
            (issuesResponse.data.data || []).slice(0, 3) : [],
          activeWarnings: Array.isArray(warningsResponse) ?
            (warningsResponse as unknown as Warning[]).filter((w: Warning) => w.isActive) : [],
          weeklyStats: {
            totalMinutes: 0,
            daysWorked: 0,
            avgPerDay: 0,
          },
        });
      } catch (error) {
        console.error('API error in loadDashboardData:', error);
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate today's stats
  const todayStats = {
    totalMinutes: dashboardData.todayLogs.reduce((sum, log) => sum + log.totalMinutes, 0),
    totalTags: dashboardData.todayLogs.length,
    hasSubmitted: dashboardData.todayLogs.length > 0,
    pendingIssues: dashboardData.recentIssues.filter(issue => issue.issueStatus === 'pending').length,
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm" onSubmit={handleLogin}>
          <h2 className="text-2xl font-bold mb-4 text-center">Employee Login</h2>
          <div className="mb-4">
            <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
            <input
              id="employeeCode"
              type="text"
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Enter your code (e.g. ZOOT1049)"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Today is {formatDateTime(currentDateTime)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Code: {employeeCode}</span>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </div>

      {/* Active Warnings */}
      {dashboardData.activeWarnings.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Active Warnings</h3>
            </div>
            <div className="mt-2 space-y-1">
              {dashboardData.activeWarnings.map((warning) => (
                <p key={warning.id} className="text-sm text-orange-700">
                  {warning.warningMessage}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today&apos;s Status</p>
                <p className="text-2xl font-bold">
                  {todayStats.hasSubmitted ? 'Submitted' : 'Pending'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today&apos;s Time</p>
                <p className="text-2xl font-bold">{formatMinutesToHours(todayStats.totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Break Status</p>
                <p className="text-2xl font-bold">
                  {dashboardData.currentBreak?.isActive ? 'On Break' : 'Working'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold">{todayStats.pendingIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/employee/work-log')}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold mb-2">Work Log</h3>
            <p className="text-sm text-muted-foreground">Submit your daily work entries</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/employee/breaks')}>
          <CardContent className="p-6 text-center">
            <Coffee className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold mb-2">Break Tracker</h3>
            <p className="text-sm text-muted-foreground">Manage your break time</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/employee/issues')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-semibold mb-2">Report Issues</h3>
            <p className="text-sm text-muted-foreground">Submit workplace issues</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/employee/performance')}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h3 className="font-semibold mb-2">Performance</h3>
            <p className="text-sm text-muted-foreground">View your analytics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}