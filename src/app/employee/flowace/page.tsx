'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Activity,
  Download
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { flowaceService, FlowaceRecord } from '@/api';
import { toast } from 'sonner';

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

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Monthly Activity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Active Hours</p>
              <p className="text-2xl font-bold">{formatHours(summary.totalActiveHours)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Productivity</p>
              <p className="text-2xl font-bold">{summary.avgProductivity}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Working Days</p>
              <p className="text-2xl font-bold">{summary.totalWorkingDays}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Daily Hours</p>
              <p className="text-2xl font-bold">{formatHours(summary.avgActiveHours)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                hasActivity: (date) => !!getRecordForDate(date)
              }}
              modifiersStyles={{
                hasActivity: { fontWeight: 'bold', textDecoration: 'underline' }
              }}
            />
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Dates with recorded activity are shown in bold and underlined
              </p>
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
                <p className="text-muted-foreground">Loading activity data...</p>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Productivity</span>
                    <span className="font-medium">{selectedRecord.productivityPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Work Hours</span>
                    <span className="font-medium">{selectedRecord.workStartTime} - {selectedRecord.workEndTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Hours</span>
                    <span className="font-medium">{formatHours(selectedRecord.activeHours || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Productive Hours</span>
                    <span className="font-medium">{formatHours(selectedRecord.productiveHours || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Logged</span>
                    <span className="font-medium">{formatHours(selectedRecord.loggedHours || 0)}</span>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
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
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading recent activity...</p>
            </div>
          ) : flowaceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activity records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flowaceRecords.slice(0, 7).reverse().map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatHours(record.activeHours || 0)} active • {record.workStartTime} - {record.workEndTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{record.productivityPercentage}%</p>
                    <p className="text-xs text-muted-foreground">productivity</p>
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