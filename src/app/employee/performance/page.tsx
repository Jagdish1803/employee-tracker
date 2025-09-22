'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Clock, Target, Award, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@clerk/nextjs';
import { flowaceService } from '@/api';
import { toast } from 'sonner';

interface PerformanceData {
  totalMinutes: number;
  totalDays: number;
  avgMinutesPerDay: number;
  tagPerformance: Record<string, {
    totalMinutes: number;
    totalCount: number;
    timePerUnit: number;
  }>;
  dailyPerformance: Record<string, number>;
}

interface WeeklyStats {
  totalMinutes: number;
  daysWorked: number;
  avgPerDay: number;
}

export default function MyPerformance() {
  const { user } = useUser();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  // Removed unused flowaceRecords state
  const [loading, setLoading] = useState(true);

  const employeeId = 1; // Use default employee ID for now

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch real Flowace data for the current employee
      const flowaceResponse = await flowaceService.getByEmployee(employeeId);

      console.log('Flowace response:', flowaceResponse);

      if (flowaceResponse.success && flowaceResponse.records) {
        // Process flowace records for performance data

        // Calculate performance data from Flowace records
        const records = flowaceResponse.records;

        const totalLoggedHours = records.reduce((sum, record) => sum + (record.loggedHours || 0), 0);
        const totalActiveHours = records.reduce((sum, record) => sum + (record.activeHours || 0), 0);
        const totalProductiveHours = records.reduce((sum, record) => sum + (record.productiveHours || 0), 0);

        const totalMinutes = totalLoggedHours * 60;
        const totalDays = records.length;
        const avgMinutesPerDay = totalDays > 0 ? totalMinutes / totalDays : 0;

        // Calculate daily performance
        const dailyPerformance: Record<string, number> = {};
        records.forEach(record => {
          if (record.date && record.loggedHours) {
            dailyPerformance[record.date] = record.loggedHours * 60; // Convert to minutes
          }
        });

        // Calculate productivity stats (removed unused variable)

        const performanceData: PerformanceData = {
          totalMinutes: Math.round(totalMinutes),
          totalDays,
          avgMinutesPerDay: Math.round(avgMinutesPerDay),
          tagPerformance: {
            'Active Hours': {
              totalMinutes: Math.round(totalActiveHours * 60),
              totalCount: records.filter(r => (r.activeHours || 0) > 0).length,
              timePerUnit: totalActiveHours > 0 ? Math.round((totalActiveHours * 60) / records.filter(r => (r.activeHours || 0) > 0).length) : 0
            },
            'Productive Hours': {
              totalMinutes: Math.round(totalProductiveHours * 60),
              totalCount: records.filter(r => (r.productiveHours || 0) > 0).length,
              timePerUnit: totalProductiveHours > 0 ? Math.round((totalProductiveHours * 60) / records.filter(r => (r.productiveHours || 0) > 0).length) : 0
            },
            'Logged Hours': {
              totalMinutes: Math.round(totalLoggedHours * 60),
              totalCount: records.filter(r => (r.loggedHours || 0) > 0).length,
              timePerUnit: totalLoggedHours > 0 ? Math.round((totalLoggedHours * 60) / records.filter(r => (r.loggedHours || 0) > 0).length) : 0
            }
          },
          dailyPerformance
        };

        // Calculate recent week stats (last 7 records)
        const recentRecords = records.slice(-7);
        const weeklyTotalMinutes = recentRecords.reduce((sum, r) => sum + ((r.loggedHours || 0) * 60), 0);
        const weeklyStats: WeeklyStats = {
          totalMinutes: Math.round(weeklyTotalMinutes),
          daysWorked: recentRecords.filter(r => (r.loggedHours || 0) > 0).length,
          avgPerDay: recentRecords.length > 0 ? Math.round(weeklyTotalMinutes / recentRecords.length) : 0
        };

        setPerformanceData(performanceData);
        setWeeklyStats(weeklyStats);
      } else {
        // Fallback to basic data if no Flowace records
        const basicPerformance: PerformanceData = {
          totalMinutes: 0,
          totalDays: 0,
          avgMinutesPerDay: 0,
          tagPerformance: {},
          dailyPerformance: {}
        };

        const basicWeeklyStats: WeeklyStats = {
          totalMinutes: 0,
          daysWorked: 0,
          avgPerDay: 0
        };

        setPerformanceData(basicPerformance);
        setWeeklyStats(basicWeeklyStats);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to load performance data');

      // Set empty data on error
      setPerformanceData({
        totalMinutes: 0,
        totalDays: 0,
        avgMinutesPerDay: 0,
        tagPerformance: {},
        dailyPerformance: {}
      });
      setWeeklyStats({
        totalMinutes: 0,
        daysWorked: 0,
        avgPerDay: 0
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPerformanceRating = (avgMinutesPerDay: number) => {
    if (avgMinutesPerDay >= 480) return { label: 'Excellent', color: 'bg-green-500', percentage: 100 };
    if (avgMinutesPerDay >= 420) return { label: 'Good', color: 'bg-blue-500', percentage: 85 };
    if (avgMinutesPerDay >= 360) return { label: 'Average', color: 'bg-yellow-500', percentage: 70 };
    return { label: 'Below Average', color: 'bg-red-500', percentage: 50 };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Performance</h1>
            <p className="text-muted-foreground">Track your work performance and productivity metrics</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!performanceData || !weeklyStats) return null;

  const performanceRating = getPerformanceRating(performanceData.avgMinutesPerDay);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Performance</h1>
          <p className="text-muted-foreground">Track your work performance and productivity metrics</p>
        </div>
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedPeriod === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(performanceData.totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">This {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(performanceData.avgMinutesPerDay)}</div>
            <p className="text-xs text-muted-foreground">Per working day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalDays}</div>
            <p className="text-xs text-muted-foreground">This {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceRating.label}</div>
            <Progress value={performanceRating.percentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Task Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Task Performance Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(performanceData.tagPerformance).map(([taskName, data]) => {
              const efficiency = data.timePerUnit;

              return (
                <div key={taskName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{taskName}</h3>
                      <Badge variant="outline">{data.totalCount} completed</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>Total Time</p>
                        <p className="font-medium text-foreground">{formatMinutes(data.totalMinutes)}</p>
                      </div>
                      <div>
                        <p>Average per Task</p>
                        <p className="font-medium text-foreground">{formatMinutes(data.timePerUnit)}</p>
                      </div>
                      <div>
                        <p>Efficiency</p>
                        <Badge variant={efficiency <= 60 ? 'default' : efficiency <= 120 ? 'secondary' : 'destructive'}>
                          {efficiency <= 60 ? 'High' : efficiency <= 120 ? 'Good' : 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-16 h-16 rounded-full ${performanceRating.color} flex items-center justify-center text-white font-bold`}>
                      {Math.round((data.totalMinutes / performanceData.totalMinutes) * 100)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Weekly Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Hours This Week</span>
                <span className="font-bold">{formatMinutes(weeklyStats.totalMinutes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Days Worked</span>
                <span className="font-bold">{weeklyStats.daysWorked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily Average</span>
                <span className="font-bold">{formatMinutes(weeklyStats.avgPerDay)}</span>
              </div>
              <Progress value={(weeklyStats.avgPerDay / 480) * 100} className="mt-4" />
              <p className="text-xs text-muted-foreground text-center">
                Target: 8 hours per day
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Maintain Consistency</p>
                  <p className="text-xs text-muted-foreground">
                    Try to maintain consistent daily work hours for better performance tracking.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Focus on Efficiency</p>
                  <p className="text-xs text-muted-foreground">
                    Optimize your task completion time to improve overall efficiency ratings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Track Progress</p>
                  <p className="text-xs text-muted-foreground">
                    Regular monitoring helps identify areas for improvement.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}