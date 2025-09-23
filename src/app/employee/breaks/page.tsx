'use client'

import React, { useState, useEffect, useCallback } from 'react';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { breakService, BreakSummary } from '@/api';

interface BreakStatus {
  id?: number;
  employeeId: number;
  breakDate: string;
  breakInTime?: string;
  breakOutTime?: string;
  breakDuration: number;
  isActive: boolean;
  warningSent: boolean;
  createdAt: string;
}

interface BreakRecord {
  id: number;
  employeeId: number;
  breakDate: string;
  breakInTime?: string;
  breakOutTime?: string;
  breakDuration: number;
  isActive: boolean;
  warningSent: boolean;
  createdAt: string;
}

interface EnhancedBreakSummary {
  totalBreaks: number;
  totalDuration: number;
  averageDuration: number;
  longestBreak: number;
  warningsReceived: number;
}

export default function BreakTracker() {
  const [currentBreak, setCurrentBreak] = useState<BreakStatus | null>(null);
  const [breakHistory, setBreakHistory] = useState<BreakRecord[]>([]);
  const [summary, setSummary] = useState<EnhancedBreakSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const employeeId = 1; // Use default employee ID for now

  // Update current time every second for real-time UI updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // Refresh break data from server every 30 seconds for persistence
      if (currentBreak?.isActive) {
        // Refresh data periodically to maintain persistence
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBreak]);

  const fetchBreakData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch break status and summary with individual error handling
      let statusResponse, summaryResponse;

      try {
        statusResponse = await breakService.getStatus(employeeId);
      } catch {
        statusResponse = null;
      }

      try {
        summaryResponse = await breakService.getSummary(employeeId);
      } catch {
        summaryResponse = null;
      }

      // Process break status
      if (statusResponse && typeof statusResponse === 'object') {
        const status = statusResponse as Record<string, unknown>;
        if (status.isActive && status.id) {
          setCurrentBreak({
            id: Number(status.id),
            employeeId: Number(status.employeeId) || employeeId,
            breakDate: String(status.breakDate) || new Date().toISOString().split('T')[0],
            breakInTime: status.breakInTime ? new Date(String(status.breakInTime)).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8),
            breakDuration: 0,
            isActive: true,
            warningSent: false,
            createdAt: String(status.createdAt) || new Date().toISOString()
          });
        } else {
          setCurrentBreak(null);
        }
      } else {
        setCurrentBreak(null);
      }

      // Process break summary
      if (summaryResponse && typeof summaryResponse === 'object') {
        const apiSummary = summaryResponse as BreakSummary;
        setSummary({
          totalBreaks: apiSummary.breakCount || 0,
          totalDuration: apiSummary.totalBreakTime || 0,
          averageDuration: apiSummary.averageBreakTime || 0,
          longestBreak: apiSummary.longestBreak || 0,
          warningsReceived: 0
        });
      } else {
        setSummary({
          totalBreaks: 0,
          totalDuration: 0,
          averageDuration: 0,
          longestBreak: 0,
          warningsReceived: 0
        });
      }

    } catch (error) {
      console.error('Failed to load break data:', error);
      toast.error('Failed to load break data', {
        description: 'Unable to connect to the server. Please try again later.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  // Check for active breaks on component mount
  useEffect(() => {
    fetchBreakData();
  }, [fetchBreakData]);

  const fetchBreakHistory = useCallback(async () => {
    try {
      const historyResponse = await breakService.getHistory(employeeId, selectedDate);

      if (Array.isArray(historyResponse)) {
        // Convert to BreakRecord format
        const processedHistory: BreakRecord[] = [];

        // Group breaks by pairs
        for (let i = 0; i < historyResponse.length; i++) {
          const record = historyResponse[i];
          processedHistory.push({
            id: record.id,
            employeeId: record.employeeId,
            breakDate: selectedDate,
            breakInTime: record.timestamp ? new Date(record.timestamp).toTimeString().slice(0, 8) : undefined,
            breakOutTime: record.type === 'out' ? new Date(record.timestamp).toTimeString().slice(0, 8) : undefined,
            breakDuration: 0, // Will be calculated
            isActive: record.type === 'in',
            warningSent: false,
            createdAt: record.created_at || record.timestamp
          });
        }

        setBreakHistory(processedHistory);
      } else {
        setBreakHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch break history:', error);
      setBreakHistory([]);
    }
  }, [employeeId, selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      await fetchBreakData();
      await fetchBreakHistory();
    };
    loadData();
  }, [fetchBreakData, fetchBreakHistory]);

  useEffect(() => {
    fetchBreakHistory();
  }, [selectedDate, fetchBreakHistory]);

  const handleBreakIn = async () => {
    if (currentBreak?.isActive) {
      toast.error('You are already on a break');
      return;
    }

    try {
      setLoading(true);
      const response = await breakService.breakIn(employeeId);

      const timestamp = response.timestamp || new Date().toISOString();
      const newBreak: BreakStatus = {
        id: response.id,
        employeeId,
        breakDate: new Date().toISOString().split('T')[0],
        breakInTime: new Date(timestamp).toTimeString().slice(0, 8),
        breakDuration: 0,
        isActive: true,
        warningSent: false,
        createdAt: response.created_at || timestamp
      };

      setCurrentBreak(newBreak);
      toast.success('Break started successfully', {
        description: 'Your break has been logged. Remember to end it when you return.',
        duration: 4000
      });

      // Refresh data
      fetchBreakData();
    } catch (error) {
      console.error('Failed to start break:', error);
      toast.error('Failed to start break', {
        description: 'There was an error starting your break. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBreakOut = async () => {
    if (!currentBreak?.isActive) {
      toast.error('You are not currently on a break');
      return;
    }

    try {
      setLoading(true);
      await breakService.breakOut(employeeId);

      const now = new Date();
      const breakInTime = new Date(`${currentBreak.breakDate}T${currentBreak.breakInTime}`);
      const duration = Math.floor((now.getTime() - breakInTime.getTime()) / (1000 * 60));

      setCurrentBreak(null);

      if (duration > 20) {
        toast.warning(`Break ended - ${duration} minutes`, {
          description: 'Your break exceeded the recommended 20 minutes. Please be mindful of break duration.',
          duration: 6000
        });
      } else {
        toast.success(`Break ended successfully`, {
          description: `Total duration: ${duration} minutes. Welcome back!`,
          duration: 4000
        });
      }

      // Refresh data
      fetchBreakData();
    } catch (error) {
      console.error('Failed to end break:', error);
      toast.error('Failed to end break', {
        description: 'There was an error ending your break. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBreakDuration = () => {
    if (!currentBreak?.isActive || !currentBreak.breakInTime) return 0;
    const breakInTime = new Date(`${currentBreak.breakDate}T${currentBreak.breakInTime}`);
    return Math.floor((currentTime.getTime() - breakInTime.getTime()) / (1000 * 60));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM
  };

  const currentDuration = getCurrentBreakDuration();
  const isLongBreak = currentDuration > 20;

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
      <Card className={currentBreak?.isActive ? (isLongBreak ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50') : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="h-5 w-5" />
            <span>Current Break Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentBreak?.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">Break In Progress</p>
                  <p className="text-muted-foreground">
                    Started at {currentBreak.breakInTime && formatTime(currentBreak.breakInTime)}
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
                disabled={loading}
                variant={isLongBreak ? 'destructive' : 'default'}
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                {loading ? 'Ending Break...' : 'End Break'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-muted-foreground">No Active Break</p>
                <p className="text-muted-foreground">Ready to start a break</p>
              </div>
              <Button onClick={handleBreakIn} disabled={loading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Starting Break...' : 'Start Break'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Break Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Break Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Breaks</p>
                <p className="text-2xl font-bold">{summary.totalBreaks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{formatDuration(summary.totalDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Duration</p>
                <p className="text-2xl font-bold">{formatDuration(summary.averageDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longest Break</p>
                <p className="text-2xl font-bold">{formatDuration(summary.longestBreak)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Break History - {new Date(selectedDate).toLocaleDateString()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading break history...</p>
            </div>
          ) : breakHistory.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No breaks taken on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {breakHistory.map((breakRecord, index) => (
                <div key={breakRecord.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {breakRecord.breakInTime && formatTime(breakRecord.breakInTime)}
                        {breakRecord.breakOutTime && ` - ${formatTime(breakRecord.breakOutTime)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(breakRecord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={breakRecord.breakDuration > 30 ? 'destructive' : 'default'}>
                      {breakRecord.isActive ? 'Active' : formatDuration(breakRecord.breakDuration)}
                    </Badge>
                    {breakRecord.warningSent && (
                      <p className="text-xs text-red-500 mt-1">Warning sent</p>
                    )}
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