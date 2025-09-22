'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  AlertCircle
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
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
  const { employee } = useEmployeeAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = employee?.id || 1;

  const loadDashboardData = useCallback(async () => {
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
      if (issuesData.status === 'fulfilled' && issuesData.value?.data?.success) {
        const issues = issuesData.value.data.data || [];
        issueStats = {
          total: issues.length,
          pending: issues.filter((i: { issueStatus: string }) => i.issueStatus === 'pending').length,
          resolved: issues.filter((i: { issueStatus: string }) => i.issueStatus === 'resolved').length
        };
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

  if (loading) {
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {employee?.name || 'Employee'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Employee ID: <span className="font-medium">{employee?.employeeCode}</span> • 
                {employee?.department && <span className="ml-1">{employee.department}</span>}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Today</div>
              <div className="text-lg font-semibold text-gray-900">
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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full space-y-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-gray-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(stats?.attendance.thisMonth.attendanceRate || 0)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.attendance.thisMonth.presentDays || 0} of {stats?.attendance.thisMonth.totalDays || 26} days
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Calendar className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress 
                  value={stats?.attendance.thisMonth.attendanceRate || 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Work Hours</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats?.attendance.thisMonth.totalHours || 0).toFixed(1)}h
                  </p>
                  <p className="text-xs text-gray-600 mt-1">This month</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Productivity</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(stats?.performance.productivity || 0)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Average this month</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Issues</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.issues.pending || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.issues.resolved || 0} resolved
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Attendance & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Section */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-3 text-gray-600" />
                  My Attendance
                </CardTitle>
                <p className="text-sm text-gray-600">Track your attendance and work hours</p>
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
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-5 w-5 mr-3 text-gray-600" />
                  Activity Tracking
                </CardTitle>
                <p className="text-sm text-gray-600">Monitor your daily productivity and activity levels</p>
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
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-3 text-gray-600" />
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
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-3 text-gray-600" />
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