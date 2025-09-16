// src/app/employee/page.tsx - Employee Dashboard
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Clock, Calendar, Coffee, FileText, BarChart3, 
  AlertTriangle, CheckCircle, TrendingUp, Target, Timer, Bell
} from 'lucide-react';
import { 
  logService, breakService, issueService, warningService 
} from '@/api';
import { Log, Break, Issue, Warning } from '@/types';
import { getCurrentISTDate, formatDateTime, formatMinutesToHours } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
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

  // Update current date/time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loggedIn && employeeId) {
      loadDashboardData(employeeId);
    }
  }, [loggedIn, employeeId]);
  // Simulate employee code lookup (replace with real API call if available)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Example: lookup employeeId by code
    // Replace with real API call if needed
    if (!employeeCode.trim()) {
      toast.error('Please enter your employee code');
      return;
    }
    // Demo: hardcoded mapping
    const codeMap: Record<string, number> = {
      'EMP-001': 9,
      'EMP-002': 10,
      'EMP-003': 11,
      // Add more codes as needed
    };
    const foundId = codeMap[employeeCode.trim().toUpperCase()];
    if (foundId) {
      setEmployeeId(foundId);
      setLoggedIn(true);
      toast.success('Login successful');
    } else {
      toast.error('Invalid employee code');
    }
  };

  const loadDashboardData = async (employeeId: number) => {
    try {
      setLoading(true);
      const today = getCurrentISTDate();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const weekAgoString = weekAgo.toISOString().split('T')[0];

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
        console.log('logsResponse:', logsResponse);
        console.log('breakStatusResponse:', breakStatusResponse);
        console.log('issuesResponse:', issuesResponse.data);
        console.log('warningsResponse:', warningsResponse);
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
        <form className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm" onSubmit={handleLogin}>
          <h2 className="text-2xl font-bold mb-4 text-center">Employee Login</h2>
          <div className="mb-4">
            <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
            <input
              id="employeeCode"
              type="text"
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Enter your code (e.g. EMP-001)"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, Employee!
              </h1>
              <p className="text-gray-600 mt-1">
                Employee Code: EMP-001 • {formatDateTime(currentDateTime)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {dashboardData.activeWarnings.length > 0 && (
                <div className="flex items-center text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{dashboardData.activeWarnings.length} warning(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Warnings */}
        {dashboardData.activeWarnings.length > 0 && (
          <Card className="mb-8 border-amber-200/60 bg-amber-50/80 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="rounded-xl p-2 bg-amber-100 border border-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Active Warnings</h3>
                  <div className="space-y-2">
                    {dashboardData.activeWarnings.map((warning) => (
                      <div key={warning.id} className="bg-white/60 rounded-lg p-3 border border-amber-200/40">
                        <p className="text-sm font-medium text-amber-800">
                          {warning.warningMessage}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {new Date(warning.warningDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl p-3 bg-green-50 border border-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today&apos;s Status</p>
                  <p className="text-xl font-bold text-gray-900">
                    {todayStats.hasSubmitted ? 'Submitted' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl p-3 bg-blue-50 border border-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today&apos;s Time</p>
                  <p className="text-xl font-bold text-gray-900">{formatMinutesToHours(todayStats.totalMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl p-3 bg-yellow-50 border border-yellow-100">
                  <Coffee className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Break Status</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.currentBreak?.isActive ? 'On Break' : 'Working'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="rounded-xl p-3 bg-red-50 border border-red-100">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Issues</p>
                  <p className="text-xl font-bold text-gray-900">{todayStats.pendingIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-200/80 cursor-pointer hover:scale-[1.02] group" 
            onClick={() => router.push('/employee/work-log')}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Work Log</h3>
              <p className="text-sm text-gray-600">Submit your daily work entries</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-200/80 cursor-pointer hover:scale-[1.02] group" 
            onClick={() => router.push('/employee/breaks')}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Coffee className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Break Tracker</h3>
              <p className="text-sm text-gray-600">Manage your break time</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-200/80 cursor-pointer hover:scale-[1.02] group" 
            onClick={() => router.push('/employee/issues')}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Report Issues</h3>
              <p className="text-sm text-gray-600">Submit workplace issues</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-200/80 cursor-pointer hover:scale-[1.02] group" 
            onClick={() => router.push('/employee/performance')}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
              <p className="text-sm text-gray-600">View your analytics</p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Summary */}
          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <div className="rounded-xl p-2 bg-green-50 border border-green-100 mr-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Work Time</span>
                <span className="font-semibold text-gray-900">{formatMinutesToHours(dashboardData.weeklyStats.totalMinutes)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Days Worked</span>
                <span className="font-semibold text-green-600">{dashboardData.weeklyStats.daysWorked}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Average Per Day</span>
                <span className="font-semibold text-gray-900">{formatMinutesToHours(dashboardData.weeklyStats.avgPerDay)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Progress to Target</span>
                <span className="font-semibold text-blue-600">
                  {Math.round((dashboardData.weeklyStats.totalMinutes / (7 * 8 * 60)) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <div className="rounded-xl p-2 bg-blue-50 border border-blue-100 mr-3">
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Today's submission status */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      todayStats.hasSubmitted ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {todayStats.hasSubmitted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {todayStats.hasSubmitted 
                        ? 'Work log submitted for today' 
                        : 'Work log pending for today'
                      }
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(new Date())}</p>
                  </div>
                </div>

                {/* Current break status */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      dashboardData.currentBreak?.isActive ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Coffee className={`h-4 w-4 ${
                        dashboardData.currentBreak?.isActive ? 'text-yellow-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {dashboardData.currentBreak?.isActive 
                        ? 'Currently on break' 
                        : 'Not on break'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {dashboardData.currentBreak?.isActive && dashboardData.currentBreak.breakInTime
                        ? `Started at ${formatDateTime(dashboardData.currentBreak.breakInTime)}`
                        : 'Ready to work'
                      }
                    </p>
                  </div>
                </div>

                {/* Recent issues */}
                {dashboardData.recentIssues.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Issues</h4>
                    {dashboardData.recentIssues.map((issue) => (
                      <div key={issue.id} className="flex items-start space-x-3 mb-2">
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                            <FileText className="h-3 w-3 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-900">{issue.issueCategory}</p>
                          <p className="text-xs text-gray-500">
                            {issue.issueStatus} • {new Date(issue.raisedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {!todayStats.hasSubmitted && (
          <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="rounded-2xl p-4 bg-white/60 w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-blue-200/40">
                <Target className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                Ready to log your work for today?
              </h3>
              <p className="text-blue-700/80 mb-6 max-w-md mx-auto">
                Submit your daily work log to track your productivity and maintain your records.
              </p>
              <Button 
                onClick={() => router.push('/employee/work-log')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                Submit Today&apos;s Work Log
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}