'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Coffee,
  Target,
  BarChart3,
  ArrowRight,
  AlertCircle,
  Timer
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { attendanceService, issueService, logService, flowaceService } from '@/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface DashboardStats {
  attendance: {
    thisMonth: {
      presentDays: number;
      totalDays: number;
      attendanceRate: number;
      totalHours: number;
    };
  };
  workLogs: {
    thisWeek: {
      totalEntries: number;
      totalHours: number;
      avgDailyHours: number;
    };
  };
  issues: {
    total: number;
    pending: number;
    resolved: number;
  };
  performance: {
    productivity: number;
    activeHours: number;
    avgDailyActive: number;
  };
}

export default function EmployeeDashboard() {
  const { user } = useUser();
  const { employee, loading: employeeLoading, error: employeeError, employeeId } = useEmployeeData();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get current week start and end
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));

      const [attendanceData, issuesData, logsData, flowaceData] = await Promise.allSettled([
        attendanceService.getEmployeeSummary(employeeId, currentMonth.toString(), currentYear.toString()),
        issueService.getByEmployee(employeeId),
        logService.getByDateRange({ employeeId, dateFrom: startOfWeek.toISOString().split('T')[0], dateTo: endOfWeek.toISOString().split('T')[0] }),
        flowaceService.getByEmployee(employeeId)
      ]);

      console.log('API calls completed:', {
        attendanceData: attendanceData.status,
        issuesData: issuesData.status,
        logsData: logsData.status,
        flowaceData: flowaceData.status
      });

      // Process attendance data
      let attendanceStats = {
        presentDays: 0,
        totalDays: 26, // Default to 26 working days (exclude Sundays only)
        attendanceRate: 0,
        totalHours: 0
      };

      if (attendanceData.status === 'fulfilled' && attendanceData.value) {
        const attData = attendanceData.value as Record<string, unknown>;
        attendanceStats = {
          presentDays: (attData.presentDays as number) || 0,
          totalDays: (attData.totalWorkingDays as number) || 26,
          attendanceRate: (attData.attendancePercentage as number) || 0,
          totalHours: (attData.totalHoursWorked as number) || 0
        };
      }

      // Process issues data
      let issueStats = { total: 0, pending: 0, resolved: 0 };
      if (issuesData.status === 'fulfilled' && issuesData.value) {
        console.log('Issues API response:', issuesData.value);

        // Handle different response structures
        let issues: { issueStatus: string }[] = [];
        const responseValue = issuesData.value as unknown;

        if (Array.isArray(responseValue)) {
          issues = responseValue;
        } else if (
          responseValue &&
          typeof responseValue === 'object' &&
          'data' in responseValue &&
          responseValue.data &&
          typeof responseValue.data === 'object' &&
          'success' in responseValue.data &&
          'data' in responseValue.data &&
          Array.isArray((responseValue.data as { data: unknown }).data)
        ) {
          issues = (responseValue.data as { data: { issueStatus: string }[] }).data;
        } else if (
          responseValue &&
          typeof responseValue === 'object' &&
          'data' in responseValue &&
          Array.isArray(responseValue.data)
        ) {
          issues = responseValue.data as { issueStatus: string }[];
        } else if (
          responseValue &&
          typeof responseValue === 'object' &&
          'success' in responseValue &&
          'data' in responseValue &&
          Array.isArray(responseValue.data)
        ) {
          issues = responseValue.data as { issueStatus: string }[];
        }

        console.log('Processed issues:', issues);

        issueStats = {
          total: issues.length,
          pending: issues.filter((i: { issueStatus: string }) => i.issueStatus === 'pending').length,
          resolved: issues.filter((i: { issueStatus: string }) => i.issueStatus === 'resolved').length
        };

        console.log('Issue stats:', issueStats);
      } else {
        console.log('Issues data not fulfilled or no value:', issuesData);
      }

      // Process work logs data
      let workLogStats = { totalEntries: 0, totalHours: 0, avgDailyHours: 0 };
      if (logsData.status === 'fulfilled' && logsData.value) {
        const logs = Array.isArray(logsData.value) ? logsData.value : (logsData.value as { data: unknown[] })?.data || [];
        const totalHours = logs.reduce((sum: number, log: unknown) => {
          const logData = log as { totalMinutes?: number };
          return sum + (logData.totalMinutes || 0);
        }, 0) / 60;
        workLogStats = {
          totalEntries: logs.length,
          totalHours: Math.round(totalHours * 100) / 100,
          avgDailyHours: Math.round((totalHours / 7) * 100) / 100
        };
      }

      // Process flowace data
      let performanceStats = { productivity: 0, activeHours: 0, avgDailyActive: 0 };
      if (flowaceData.status === 'fulfilled' && flowaceData.value?.success) {
        const records = flowaceData.value.records || [];
        const recentRecords = records.slice(0, 30); // Last 30 days
        if (recentRecords.length > 0) {
          const totalActiveHours = recentRecords.reduce((sum: number, r: { activeHours?: number }) => sum + (r.activeHours || 0), 0);
          const avgProductivity = recentRecords.reduce((sum: number, r: { productivityPercentage?: number }) => sum + (r.productivityPercentage || 0), 0) / recentRecords.length;

          performanceStats = {
            productivity: Math.round(avgProductivity),
            activeHours: Math.round(totalActiveHours * 100) / 100,
            avgDailyActive: Math.round((totalActiveHours / recentRecords.length) * 100) / 100
          };
        }
      }

      setStats({
        attendance: { thisMonth: attendanceStats },
        workLogs: { thisWeek: workLogStats },
        issues: issueStats,
        performance: performanceStats
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadDashboardData();
  }, [employeeId, loadDashboardData]);

  // Show error if employee data failed to load
  if (employeeError) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">Access Error</h3>
            <p className="text-gray-500">{employeeError}</p>
            <p className="text-sm text-gray-400 mt-2">Please contact your administrator to verify your employee code.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if employee data is still loading
  if (employeeLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b w-full">
        <div className="w-full px-3 md:px-4 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {employee?.name || user?.fullName || 'Employee'}!
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Employee: <span className="font-medium">{employee?.name || user?.fullName}</span>
                {employee?.employeeCode && <span className="hidden sm:inline"> • Code: {employee.employeeCode}</span>}
              </p>
            </div>
            <div className="text-left md:text-right flex-shrink-0">
              <div className="text-xs md:text-sm text-muted-foreground">Today</div>
              <div className="text-sm md:text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 md:px-4 lg:px-8 py-4 md:py-8">
        <div className="w-full space-y-4 md:space-y-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Attendance Rate</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats?.attendance.thisMonth.attendanceRate || 0)}%
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                {stats?.attendance.thisMonth.presentDays || 0} of {stats?.attendance.thisMonth.totalDays || 26} days
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Work Hours</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(stats?.attendance.thisMonth.totalHours || 0).toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Timer className="h-3 w-3 mr-1 text-blue-500" />
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Productivity</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats?.performance.productivity || 0)}%
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                Average this month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Issues</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.issues.pending || 0}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Target className="h-3 w-3 mr-1 text-red-500" />
                {stats?.issues.resolved || 0} resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Attendance & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Section */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  My Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.attendance.thisMonth.presentDays || 0}
                    </div>
                    <div className="text-sm text-gray-600">Present Days</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {(stats?.attendance.thisMonth.totalHours || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {((stats?.attendance.thisMonth.totalHours || 0) / (stats?.attendance.thisMonth.presentDays || 1)).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Hours/Day</div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-center">
                  <Link href="/employee/attendance">
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Full Attendance
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  Activity Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {(stats?.performance.activeHours || 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Active Hours</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(stats?.performance.productivity || 0)}%
                    </div>
                    <div className="text-sm text-gray-600">Productivity</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {(stats?.performance.avgDailyActive || 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Daily Average</div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-center">
                  <Link href="/employee/flowace">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                      <Activity className="h-4 w-4 mr-2" />
                      View Activity Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Links */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/employee/work-assignments" className="block">
                  <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Work & Assignments</div>
                      <div className="text-sm text-gray-600">Track tasks and log work</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>

                <Link href="/employee/issues" className="block">
                  <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Report Issue</div>
                      <div className="text-sm text-gray-600">Get help quickly</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>

                <Link href="/employee/breaks" className="block">
                  <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <Coffee className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Track Breaks</div>
                      <div className="text-sm text-gray-600">Manage break times</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* This Week Summary */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Work Log Entries</span>
                    <span className="font-semibold">{stats?.workLogs.thisWeek.totalEntries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Hours Logged</span>
                    <span className="font-semibold">{stats?.workLogs.thisWeek.totalHours || 0}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Daily Average</span>
                    <span className="font-semibold">{stats?.workLogs.thisWeek.avgDailyHours || 0}h</span>
                  </div>
                </div>
                <Separator />
                <div className="text-center">
                  <Badge 
                    variant={
                      (stats?.workLogs.thisWeek.avgDailyHours || 0) >= 8 
                        ? "default" 
                        : (stats?.workLogs.thisWeek.avgDailyHours || 0) >= 6 
                        ? "secondary" 
                        : "destructive"
                    }
                    className="px-3 py-1"
                  >
                    {(stats?.workLogs.thisWeek.avgDailyHours || 0) >= 8 
                      ? "On Track" 
                      : (stats?.workLogs.thisWeek.avgDailyHours || 0) >= 6 
                      ? "Good Progress" 
                      : "Needs Attention"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}