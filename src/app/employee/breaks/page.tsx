'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Coffee,
  Play,
  Square,
  AlertTriangle,
  Calendar,
  Clock,
  Timer,
  TrendingUp
} from 'lucide-react';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { useBreakStatus, useBreakHistory, useBreakSummary, useBreakIn, useBreakOut, BreakStatus, EnhancedBreakRecord } from '@/hooks/useBreakQuery';

// Helper functions to prevent NaN issues
const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : 0;
  }
  return 0;
};

const formatDuration = (minutes: number): string => {
  const safeMins = safeNumber(minutes);
  const hours = Math.floor(safeMins / 60);
  const mins = safeMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return 'Not recorded';
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return 'Invalid time';
    return date.toTimeString().slice(0, 5); // HH:MM
  } catch {
    return 'Invalid time';
  }
};

const calculateDuration = (startTime: string | null | undefined, endTime?: string | null): number => {
  if (!startTime) return 0;

  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    return Math.max(0, duration); // Ensure non-negative
  } catch {
    return 0;
  }
};

export default function BreakTracker() {
  const [, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get employee data
  const { employeeId, loading: employeeLoading, error: employeeError } = useEmployeeData();

  // React Query hooks
  const { data: breakStatus, isLoading: statusLoading, error: statusError } = useBreakStatus(employeeId);
  const { data: breakHistory, isLoading: historyLoading } = useBreakHistory(employeeId, selectedDate);
  const { data: breakSummary, isLoading: summaryLoading } = useBreakSummary(employeeId);

  // Mutations
  const breakInMutation = useBreakIn();
  const breakOutMutation = useBreakOut();

  // Update current time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate current break duration safely
  const getCurrentBreakDuration = (): number => {
    const status = breakStatus as BreakStatus | null;
    if (!status || !status.isActive || !status.breakInTime) return 0;
    return calculateDuration(status.breakInTime);
  };

  // Process break history safely
  const processedHistory = React.useMemo(() => {
    if (!Array.isArray(breakHistory)) return [];

    return breakHistory.map((item: EnhancedBreakRecord, index: number) => ({
      id: item.id || index,
      breakInTime: item.breakInTime || item.timestamp,
      breakOutTime: item.breakOutTime,
      duration: item.breakOutTime
        ? calculateDuration(item.breakInTime || item.timestamp, item.breakOutTime)
        : 0,
      isActive: !item.breakOutTime,
      date: selectedDate,
    }));
  }, [breakHistory, selectedDate]);

  // Process break summary safely
  const summaryStats = React.useMemo(() => {
    if (!breakSummary) {
      return {
        totalBreaks: 0,
        totalDuration: 0,
        averageDuration: 0,
        longestBreak: 0,
      };
    }

    return {
      totalBreaks: safeNumber(breakSummary.breakCount),
      totalDuration: safeNumber(breakSummary.totalBreakTime),
      averageDuration: safeNumber(breakSummary.averageBreakTime),
      longestBreak: safeNumber(breakSummary.longestBreak),
    };
  }, [breakSummary]);

  const currentDuration = getCurrentBreakDuration();
  const isLongBreak = currentDuration > 20;
  const isLoading = statusLoading || breakInMutation.isPending || breakOutMutation.isPending;

  // Handle break actions
  const handleBreakIn = () => {
    if (!employeeId) return;
    breakInMutation.mutate(employeeId);
  };

  const handleBreakOut = () => {
    if (!employeeId) return;
    breakOutMutation.mutate(employeeId);
  };

  // Error states
  if (employeeError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-600 mb-2">Access Error</h3>
          <p className="text-gray-500">{employeeError}</p>
          <p className="text-sm text-gray-400 mt-2">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Loading states
  if (employeeLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Break Tracker</h1>
          <p className="text-muted-foreground">Manage your break times and view history</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="break-date">View Date:</Label>
          <Input
            id="break-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Current Break Status */}
      <Card className={(breakStatus as BreakStatus)?.isActive ? (isLongBreak ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50') : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="h-5 w-5" />
            <span>Current Break Status</span>
            {statusError && (
              <Badge variant="destructive" className="text-xs">
                Error loading status
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading break status...</p>
            </div>
          ) : (breakStatus as BreakStatus)?.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">Break In Progress</p>
                  <p className="text-muted-foreground">
                    Started at {formatTime((breakStatus as BreakStatus)?.breakInTime)}
                  </p>
                </div>
                <Badge variant={isLongBreak ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                  {formatDuration(currentDuration)}
                </Badge>
              </div>

              {isLongBreak && (
                <div className="flex items-center space-x-2 p-3 bg-red-100 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 font-medium">
                    Break time exceeded recommended duration (20 minutes)
                  </p>
                </div>
              )}

              <Button
                onClick={handleBreakOut}
                disabled={isLoading}
                variant={isLongBreak ? 'destructive' : 'default'}
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                {breakOutMutation.isPending ? 'Ending Break...' : 'End Break'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-muted-foreground">No Active Break</p>
                <p className="text-muted-foreground">Ready to start a break</p>
              </div>
              <Button
                onClick={handleBreakIn}
                disabled={isLoading || !employeeId}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {breakInMutation.isPending ? 'Starting Break...' : 'Start Break'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Break Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Today&apos;s Break Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading summary...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Timer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Total Breaks</p>
                <p className="text-2xl font-bold">{summaryStats.totalBreaks}</p>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{formatDuration(summaryStats.totalDuration)}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Average Duration</p>
                <p className="text-2xl font-bold">{formatDuration(summaryStats.averageDuration)}</p>
              </div>
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Longest Break</p>
                <p className="text-2xl font-bold">{formatDuration(summaryStats.longestBreak)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Break History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Break History - {new Date(selectedDate).toLocaleDateString()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading break history...</p>
            </div>
          ) : processedHistory.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No breaks taken on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedHistory.map((breakRecord) => (
                <div key={breakRecord.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {formatTime(breakRecord.breakInTime)}
                        {breakRecord.breakOutTime && ` - ${formatTime(breakRecord.breakOutTime)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(breakRecord.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={breakRecord.duration > 30 ? 'destructive' : breakRecord.isActive ? 'secondary' : 'default'}>
                      {breakRecord.isActive ? 'Active' : formatDuration(breakRecord.duration)}
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