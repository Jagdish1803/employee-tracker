'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Activity,
  Clock,
  TrendingUp,
  Calendar as CalendarIcon,
  BarChart3,
  Download
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { flowaceService, FlowaceRecord } from '@/api';
import { toast } from 'react-hot-toast';

export default function FlowaceActivity() {
  const { employee } = useEmployeeAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [flowaceRecords, setFlowaceRecords] = useState<FlowaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const employeeId = employee?.id || 1;

  const fetchFlowaceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await flowaceService.getByEmployee(employeeId);

      if (response.success && Array.isArray(response.records)) {
        // Filter records by current month
        const filteredRecords = response.records.filter(record => {
          const recordDate = new Date(record.date);
          return isWithinInterval(recordDate, {
            start: new Date(dateRange.from),
            end: new Date(dateRange.to)
          });
        });
        setFlowaceRecords(filteredRecords);
      } else {
        setFlowaceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching flowace data:', error);
      toast.error('Failed to load flowace data');
      setFlowaceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, dateRange]);

  useEffect(() => {
    fetchFlowaceData();
  }, [fetchFlowaceData]);

  useEffect(() => {
    // Update date range when month changes
    setDateRange({
      from: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      to: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    });
  }, [currentMonth]);

  const getRecordForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return flowaceRecords.find(record => record.date === dateStr);
  };

  const getSelectedDateRecord = () => {
    if (!selectedDate) return null;
    return getRecordForDate(selectedDate);
  };

  const calculateSummary = () => {
    if (flowaceRecords.length === 0) {
      return {
        totalActiveHours: 0,
        avgProductivity: 0,
        totalWorkingDays: 0,
        avgActiveHours: 0
      };
    }

    const totalActiveHours = flowaceRecords.reduce((sum, record) =>
      sum + (record.activeHours || 0), 0
    );

    const avgProductivity = flowaceRecords.reduce((sum, record) =>
      sum + (record.productivityPercentage || 0), 0
    ) / flowaceRecords.length;

    const totalWorkingDays = flowaceRecords.length;
    const avgActiveHours = totalActiveHours / totalWorkingDays;

    return {
      totalActiveHours: Math.round(totalActiveHours * 100) / 100,
      avgProductivity: Math.round(avgProductivity * 100) / 100,
      totalWorkingDays,
      avgActiveHours: Math.round(avgActiveHours * 100) / 100
    };
  };

  const summary = calculateSummary();
  const selectedRecord = getSelectedDateRecord();

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getProductivityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityBadge = (record: FlowaceRecord) => {
    const productivity = record.productivityPercentage || 0;
    if (productivity >= 80) return { label: 'High', variant: 'default' as const };
    if (productivity >= 60) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'destructive' as const };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Tracking</h1>
          <p className="text-muted-foreground">Monitor your daily productivity and activity levels</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(summary.totalActiveHours)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(summary.avgProductivity)}`}>
              {summary.avgProductivity}%
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Days</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalWorkingDays}</div>
            <p className="text-xs text-muted-foreground">
              Days with activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Hours</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(summary.avgActiveHours)}</div>
            <p className="text-xs text-muted-foreground">
              Per working day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on a date to view detailed activity
            </p>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border"
              modifiers={{
                hasActivity: (date) => !!getRecordForDate(date),
                highProductivity: (date) => {
                  const record = getRecordForDate(date);
                  return record ? (record.productivityPercentage || 0) >= 80 : false;
                },
                mediumProductivity: (date) => {
                  const record = getRecordForDate(date);
                  return record ? (record.productivityPercentage || 0) >= 60 && (record.productivityPercentage || 0) < 80 : false;
                },
                lowProductivity: (date) => {
                  const record = getRecordForDate(date);
                  return record ? (record.productivityPercentage || 0) < 60 : false;
                }
              }}
              modifiersStyles={{
                highProductivity: { backgroundColor: '#dcfce7', color: '#166534' },
                mediumProductivity: { backgroundColor: '#fef3c7', color: '#92400e' },
                lowProductivity: { backgroundColor: '#fee2e2', color: '#991b1b' }
              }}
            />

            {/* Legend */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Legend:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>High Productivity (80%+)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Medium Productivity (60-79%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Low Productivity (&lt;60%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading activity data...</p>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Productivity:</span>
                  <Badge variant={getActivityBadge(selectedRecord).variant}>
                    {selectedRecord.productivityPercentage}% - {getActivityBadge(selectedRecord).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Work Hours</p>
                    <p className="text-muted-foreground">
                      {selectedRecord.workStartTime} - {selectedRecord.workEndTime}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Total Logged</p>
                    <p className="text-muted-foreground">
                      {formatHours(selectedRecord.loggedHours || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Active Hours</p>
                    <p className="text-green-600 font-medium">
                      {formatHours(selectedRecord.activeHours || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Idle Hours</p>
                    <p className="text-red-600 font-medium">
                      {formatHours(selectedRecord.idleHours || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Productive</p>
                    <p className="text-green-600">
                      {formatHours(selectedRecord.productiveHours || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Unproductive</p>
                    <p className="text-red-600">
                      {formatHours(selectedRecord.unproductiveHours || 0)}
                    </p>
                  </div>
                </div>

                {selectedRecord.activityPercentage && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Activity Level:</span>
                      <span className={getProductivityColor(selectedRecord.activityPercentage)}>
                        {selectedRecord.activityPercentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activity recorded for this date</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a date to view activity details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading recent activity...</p>
            </div>
          ) : flowaceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flowaceRecords.slice(0, 7).reverse().map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{formatHours(record.activeHours || 0)} active</span>
                        <span>•</span>
                        <span>{record.workStartTime} - {record.workEndTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getActivityBadge(record).variant}>
                      {record.productivityPercentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}