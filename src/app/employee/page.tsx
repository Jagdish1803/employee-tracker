'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Coffee,
  CheckCircle,
  Target,
  BarChart3,
  ArrowRight
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
        totalDays: 22,
        attendanceRate: 0,
        totalHours: 0
      };

      if (attendanceData.status === 'fulfilled' && attendanceData.value) {
        const attData = attendanceData.value as Record<string, unknown>;
        attendanceStats = {
          presentDays: (attData.presentDays as number) || 0,
          totalDays: (attData.totalWorkingDays as number) || 22,
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {employee?.name || 'Employee'}!</h1>
          <p className="text-muted-foreground">Employee Code: {employee?.employeeCode}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Today is</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.performance.productivity || 0}%</div>
              <p className="text-sm text-muted-foreground">Avg Productivity</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.performance.activeHours || 0}h</div>
              <p className="text-sm text-muted-foreground">Active Hours (30d)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.performance.avgDailyActive || 0}h</div>
              <p className="text-sm text-muted-foreground">Daily Avg</p>
            </div>
            <div className="text-center">
              <Badge
                className={`text-sm px-3 py-1 ${
                  (stats?.performance.productivity || 0) >= 75
                    ? 'bg-green-100 text-green-800'
                    : (stats?.performance.productivity || 0) >= 50
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {(stats?.performance.productivity || 0) >= 75 ? 'Excellent' :
                 (stats?.performance.productivity || 0) >= 50 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats?.attendance.thisMonth.attendanceRate || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.attendance.thisMonth.presentDays || 0}/{stats?.attendance.thisMonth.totalDays || 22} days present
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats?.attendance.thisMonth.totalHours || 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total hours this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Logs</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.workLogs.thisWeek.totalEntries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Entries this week ({stats?.workLogs.thisWeek.totalHours || 0}h total)
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.issues.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending ({stats?.issues.total || 0} total, {stats?.issues.resolved || 0} resolved)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Submit Work Log
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Track your daily work activities and tasks
            </p>
            <Link href="/employee/work-log">
              <Button className="w-full">
                Go to Work Log
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Activity Tracking
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View your productivity and activity metrics
            </p>
            <Link href="/employee/flowace">
              <Button variant="outline" className="w-full">
                View Activity
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-orange-600" />
                Break Tracker
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage your break times throughout the day
            </p>
            <Link href="/employee/breaks">
              <Button variant="outline" className="w-full">
                Track Breaks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              This Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Daily Work Log</span>
              <span className="font-medium">{stats?.workLogs.thisWeek.avgDailyHours || 0}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Entries</span>
              <span className="font-medium">{stats?.workLogs.thisWeek.totalEntries || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Hours Logged</span>
              <span className="font-medium">{stats?.workLogs.thisWeek.totalHours || 0}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/employee/attendance" className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                <span className="text-sm">My Attendance</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/employee/issues" className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-orange-600" />
                <span className="text-sm">My Issues</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/employee/assignments" className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                <span className="text-sm">My Assignments</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}