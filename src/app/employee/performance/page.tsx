// src/app/employee/performance/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { BarChart3, LogOut, Calendar, TrendingUp, Clock, Target } from 'lucide-react';
import { logService, employeeService } from '@/api';
import { Log, Employee } from '@/types';
import { formatMinutesToHours, getDateRange } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PerformancePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const router = useRouter();

  const loadPerformanceData = useCallback(async (employeeId: number) => {
    try {
      setLoading(true);

      let dateFrom, dateTo;
      if (useCustomRange && customDateFrom && customDateTo) {
        dateFrom = customDateFrom;
        dateTo = customDateTo;
      } else {
        const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
        const range = getDateRange(days);
        dateFrom = range.start;
        dateTo = range.end;
      }

      const response = await logService.getByDateRange({
        employeeId,
        dateFrom,
        dateTo,
      });

      setLogs(Array.isArray(response) ? response as Log[] : []);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, useCustomRange, customDateFrom, customDateTo]);

  useEffect(() => {
    // Check if employee is already logged in
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      try {
        const emp = JSON.parse(savedEmployee);
        setEmployee(emp);
        setIsLoggedIn(true);
        loadPerformanceData(emp.id);
      } catch {
        localStorage.removeItem('employee');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [loadPerformanceData]);

  useEffect(() => {
    if (employee && (dateRange || (useCustomRange && customDateFrom && customDateTo))) {
      loadPerformanceData(employee.id);
    }
  }, [employee, dateRange, customDateFrom, customDateTo, useCustomRange, loadPerformanceData]);

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
        loadPerformanceData(emp.id);
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
    setLogs([]);
    localStorage.removeItem('employee');
    toast.success('Logged out successfully');
  };

  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    const totalMinutes = logs.reduce((sum, log) => sum + log.totalMinutes, 0);
    const totalDays = new Set(logs.map(log => new Date(log.logDate).toDateString())).size;
    const avgMinutesPerDay = totalDays > 0 ? totalMinutes / totalDays : 0;
    
    // Group by tag
    const tagPerformance = logs.reduce((acc, log) => {
      const tagName = log.tag?.tagName || 'Unknown';
      if (!acc[tagName]) {
        acc[tagName] = { totalMinutes: 0, totalCount: 0, timePerUnit: log.tag?.timeMinutes || 0 };
      }
      acc[tagName].totalMinutes += log.totalMinutes;
      acc[tagName].totalCount += log.count;
      return acc;
    }, {} as Record<string, { totalMinutes: number; totalCount: number; timePerUnit: number }>);

    // Group by date for trend
    const dailyPerformance = logs.reduce((acc, log) => {
      const date = new Date(log.logDate).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += log.totalMinutes;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMinutes,
      totalDays,
      avgMinutesPerDay,
      tagPerformance,
      dailyPerformance,
    };
  }, [logs]);

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
              <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
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
        {/* Date Range Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="preset"
                  name="dateType"
                  checked={!useCustomRange}
                  onChange={() => setUseCustomRange(false)}
                />
                <Label htmlFor="preset">Preset Range</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  name="dateType"
                  checked={useCustomRange}
                  onChange={() => setUseCustomRange(true)}
                />
                <Label htmlFor="custom">Custom Range</Label>
              </div>
            </div>

            {!useCustomRange ? (
              <Select value={dateRange || undefined} onValueChange={(value: 'week' | 'month' | 'quarter') => setDateRange(value)}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="dateFrom">From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">{formatMinutesToHours(performanceMetrics.totalMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                  <p className="text-2xl font-bold">{performanceMetrics.totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg Per Day</p>
                  <p className="text-2xl font-bold">{formatMinutesToHours(Math.round(performanceMetrics.avgMinutesPerDay))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tag Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Tag</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(performanceMetrics.tagPerformance).length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No data available</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Submit work logs to see your performance data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(performanceMetrics.tagPerformance).map(([tagName, data]) => (
                    <div key={tagName} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{tagName}</h4>
                        <span className="text-sm text-gray-600">{data.totalCount} units</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Time: {formatMinutesToHours(data.totalMinutes)}</span>
                        <span>Rate: {data.timePerUnit}min/unit</span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(data.totalMinutes / performanceMetrics.totalMinutes) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(performanceMetrics.dailyPerformance).length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No daily data</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Work logs will show daily trends here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(performanceMetrics.dailyPerformance)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, minutes]) => (
                      <div key={date} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium">{date}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">{formatMinutesToHours(minutes)}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((minutes / (8 * 60)) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {logs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Most Productive Day</h4>
                  <p className="text-blue-800">
                    {Object.entries(performanceMetrics.dailyPerformance).reduce((a, b) => 
                      performanceMetrics.dailyPerformance[a[0]] > performanceMetrics.dailyPerformance[b[0]] ? a : b
                    )[0]}
                  </p>
                  <p className="text-sm text-blue-600">
                    {formatMinutesToHours(Math.max(...Object.values(performanceMetrics.dailyPerformance)))}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Top Performing Tag</h4>
                  <p className="text-green-800">
                    {Object.entries(performanceMetrics.tagPerformance).reduce((a, b) => 
                      a[1].totalMinutes > b[1].totalMinutes ? a : b
                    )[0]}
                  </p>
                  <p className="text-sm text-green-600">
                    {formatMinutesToHours(Math.max(...Object.values(performanceMetrics.tagPerformance).map(t => t.totalMinutes)))}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Consistency Score</h4>
                  <p className="text-purple-800">
                    {Math.round((performanceMetrics.totalDays / 7) * 100)}%
                  </p>
                  <p className="text-sm text-purple-600">
                    Based on daily submissions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}