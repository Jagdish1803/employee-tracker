// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users, Tag, FileText, AlertTriangle, BarChart3, Clock, Coffee,
  Settings, Calendar, TrendingUp, Activity, CheckCircle2, Eye,
  ArrowUpRight, Timer
} from 'lucide-react';
import { employeeService, tagService, issueService, logService } from '@/api';
import { getCurrentISTDate } from '@/lib/utils';
import { getAdminSession, saveAdminSession, isValidAdminCode } from '@/lib/admin-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DashboardData {
  totalEmployees: number;
  totalTags: number;
  todaysSubmissions: number;
  pendingIssues: number;
  totalIssues: number;
  recentActivity: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    totalEmployees: 0,
    totalTags: 0,
    todaysSubmissions: 0,
    pendingIssues: 0,
    totalIssues: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check if admin is already logged in
      const existingSession = getAdminSession();
      const code = searchParams.get('code');
      
      if (existingSession) {
        setIsAuthenticated(true);
        loadDashboardData();
        return;
      }
      
      if (!code || !isValidAdminCode(code)) {
        router.push('/');
        return;
      }
      
      // Save new admin session
      saveAdminSession(code);
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, [mounted, searchParams, router]);

  const loadDashboardData = async () => {
    try {
      const today = getCurrentISTDate();
      
      const [employeesRes, tagsRes, issuesRes, logsRes] = await Promise.all([
        employeeService.getAll(),
        tagService.getAll(),
        issueService.getAll(),
        logService.getByDateRange({ dateFrom: today, dateTo: today }),
      ]);

      const employees = employeesRes.data.success ? employeesRes.data.data || [] : [];
      const tags = tagsRes.data.success ? tagsRes.data.data || [] : [];
      const issues = issuesRes.data.success ? issuesRes.data.data || [] : [];
      const logs = Array.isArray(logsRes) ? logsRes as { employeeId: number }[] : [];

      // Calculate today's submissions (unique employees who submitted)
      const todaysSubmissions = new Set(logs.map(log => log.employeeId)).size;
      
      // Count pending issues
      const pendingIssues = issues.filter(issue => issue.issueStatus === 'pending').length;

      setData({
        totalEmployees: employees.length,
        totalTags: tags.length,
        todaysSubmissions,
        pendingIssues,
        totalIssues: issues.length,
        recentActivity: [], // Would be populated with recent activity data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-8">
      {/* Header Section */}
      <div className="border-b border-border/40 pb-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage your organization&apos;s productivity and operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              System Online
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Key Metrics</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Employees</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data.totalEmployees}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Active in system
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Work Tags</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data.totalTags}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Work categories
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Today&apos;s Submissions</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data.todaysSubmissions}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Timer className="h-3 w-3 mr-1 text-yellow-500" />
                Work logs submitted
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Issues</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data.pendingIssues}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Eye className="h-3 w-3 mr-1 text-red-500" />
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/daily-chart">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Daily Chart</h3>
                    <p className="text-sm text-muted-foreground">View today&apos;s work submissions</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/employees">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Manage Employees</h3>
                    <p className="text-sm text-muted-foreground">Add and edit employee records</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/assignments">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Tag Assignments</h3>
                    <p className="text-sm text-muted-foreground">Assign tags to employees</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/issues">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    {data.pendingIssues > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{data.pendingIssues}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Issue Management</h3>
                      {data.pendingIssues > 0 && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          {data.pendingIssues} pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Review and respond to issues</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/breaks">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-yellow-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <Coffee className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">Break Management</h3>
                    <p className="text-sm text-muted-foreground">Monitor employee breaks</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/edit-logs">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-4 bg-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Edit Work Logs</h3>
                    <p className="text-sm text-muted-foreground">Modify submitted work entries</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Analytics & Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Analytics Overview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Today&apos;s Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Total Employees</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                  {data.totalEmployees}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Submitted Today</span>
                <Badge className="bg-green-500 hover:bg-green-600 font-semibold">
                  {data.todaysSubmissions}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Pending Submissions</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-semibold">
                  {data.totalEmployees - data.todaysSubmissions}
                </Badge>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Submission Rate</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.totalEmployees > 0 
                      ? Math.round((data.todaysSubmissions / data.totalEmployees) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <Progress 
                  value={data.totalEmployees > 0 ? (data.todaysSubmissions / data.totalEmployees) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                Issues & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Total Issues</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-semibold">
                  {data.totalIssues}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Pending Issues</span>
                <Badge variant={data.pendingIssues > 0 ? "destructive" : "outline"} className="font-semibold">
                  {data.pendingIssues}
                </Badge>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Resolution Rate</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.totalIssues > 0 
                      ? Math.round(((data.totalIssues - data.pendingIssues) / data.totalIssues) * 100)
                      : 100
                    }%
                  </span>
                </div>
                <Progress 
                  value={data.totalIssues > 0 ? ((data.totalIssues - data.pendingIssues) / data.totalIssues) * 100 : 100} 
                  className="h-2" 
                />
              </div>
              {data.pendingIssues > 0 && (
                <Link href="/admin/issues" className="block">
                  <Button variant="outline" size="sm" className="w-full hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Review {data.pendingIssues} Pending Issues
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}