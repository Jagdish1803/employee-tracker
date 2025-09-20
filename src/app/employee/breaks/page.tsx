'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coffee,
  Play,
  Square,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
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

interface EnhancedBreakSummary {
  totalBreaks: number;
  totalDuration: number;
  averageDuration: number;
  longestBreak: number;
  warningsReceived: number;
}

export default function BreakTracker() {
  const { employee } = useEmployeeAuth();
  const [currentBreak, setCurrentBreak] = useState<BreakStatus | null>(null);
  const [breakHistory, setBreakHistory] = useState<BreakStatus[]>([]);
  const [summary, setSummary] = useState<EnhancedBreakSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const employeeId = employee?.id || 1;

  // Update current time every second when on break
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentBreak?.isActive) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentBreak]);

  const fetchBreakData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch break status, history, and summary in parallel
      const [statusResponse, historyResponse, summaryResponse] = await Promise.all([
        breakService.getStatus(employeeId),
        breakService.getHistory(employeeId),
        breakService.getSummary(employeeId)
      ]);

      console.log('Break status:', statusResponse);
      console.log('Break history:', historyResponse);
      console.log('Break summary:', summaryResponse);

      // Process break status - handle the new API format
      if (statusResponse && typeof statusResponse === 'object') {
        const status = statusResponse as {
          id?: number;
          employeeId?: number;
          breakDate?: string;
          breakInTime?: string;
          isActive?: boolean;
          created_at?: string;
        };

        if (status.isActive && status.id) {
          setCurrentBreak({
            id: status.id,
            employeeId: status.employeeId || employeeId,
            breakDate: status.breakDate || new Date().toISOString().split('T')[0],
            breakInTime: status.breakInTime ? new Date(status.breakInTime).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8),
            breakDuration: 0,
            isActive: true,
            warningSent: false,
            createdAt: status.created_at || new Date().toISOString()
          });
        } else {
          setCurrentBreak(null);
        }
      } else {
        setCurrentBreak(null);
      }

      // Process break history - convert BreakRecord[] to BreakStatus[]
      if (Array.isArray(historyResponse)) {
        const todayDate = new Date().toISOString().split('T')[0];
        const processedHistory: BreakStatus[] = [];

        // Group break records by pairs (in/out)
        const todayRecords = historyResponse.filter(record =>
          record.timestamp.startsWith(todayDate)
        );

        for (let i = 0; i < todayRecords.length; i += 2) {
          const inRecord = todayRecords.find(r => r.type === 'in');
          const outRecord = todayRecords.find(r => r.type === 'out' && r.timestamp > (inRecord?.timestamp || ''));

          if (inRecord) {
            const breakInTime = new Date(inRecord.timestamp);
            const breakOutTime = outRecord ? new Date(outRecord.timestamp) : null;
            const duration = breakOutTime
              ? Math.floor((breakOutTime.getTime() - breakInTime.getTime()) / (1000 * 60))
              : 0;

            processedHistory.push({
              id: inRecord.id,
              employeeId: inRecord.employeeId,
              breakDate: todayDate,
              breakInTime: breakInTime.toTimeString().slice(0, 8),
              breakOutTime: breakOutTime?.toTimeString().slice(0, 8),
              breakDuration: duration,
              isActive: !outRecord,
              warningSent: duration > 30,
              createdAt: inRecord.created_at || inRecord.timestamp
            });
          }
        }

        setBreakHistory(processedHistory);
      } else {
        setBreakHistory([]);
      }

      // Process break summary
      if (summaryResponse && typeof summaryResponse === 'object') {
        const apiSummary = summaryResponse as BreakSummary;
        setSummary({
          totalBreaks: apiSummary.breakCount || 0,
          totalDuration: apiSummary.totalBreakTime || 0,
          averageDuration: apiSummary.averageBreakTime || 0,
          longestBreak: apiSummary.longestBreak || 0,
          warningsReceived: 0 // This would need to be calculated separately
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
      console.error('Error fetching break data:', error);
      toast.error('Failed to load break data');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchBreakData();
  }, [fetchBreakData]);

  const handleBreakIn = async () => {
    if (currentBreak?.isActive) {
      toast.error('You are already on a break');
      return;
    }

    try {
      setLoading(true);

      const response = await breakService.breakIn(employeeId);
      console.log('Break in response:', response);

      const newBreak: BreakStatus = {
        id: response.id,
        employeeId,
        breakDate: new Date().toISOString().split('T')[0],
        breakInTime: new Date(response.timestamp).toTimeString().slice(0, 8),
        breakDuration: 0,
        isActive: true,
        warningSent: false,
        createdAt: response.created_at || response.timestamp
      };

      setCurrentBreak(newBreak);
      toast.success('Break started');
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Failed to start break');
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

      const response = await breakService.breakOut(employeeId);
      console.log('Break out response:', response);

      const now = new Date();
      const breakInTime = new Date(`${currentBreak.breakDate}T${currentBreak.breakInTime}`);
      const duration = Math.floor((now.getTime() - breakInTime.getTime()) / (1000 * 60));

      const updatedBreak: BreakStatus = {
        ...currentBreak,
        breakOutTime: new Date(response.timestamp).toTimeString().slice(0, 8),
        breakDuration: duration,
        isActive: false
      };

      setBreakHistory(prev => [updatedBreak, ...prev.filter(b => b.id !== currentBreak.id)]);
      setCurrentBreak(null);

      toast.success(`Break ended. Duration: ${duration} minutes`);

      // Show warning if break was too long (over 30 minutes)
      if (duration > 30) {
        toast.error('Break exceeded recommended duration (30 minutes)');
      }

      // Refresh break data to get updated summary
      fetchBreakData();
    } catch (error) {
      console.error('Error ending break:', error);
      toast.error('Failed to end break');
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
  const isLongBreak = currentDuration > 30;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Break Tracker</h1>
          <p className="text-muted-foreground">Manage your break times and view history</p>
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
                    Break time exceeded recommended duration (30 minutes)
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
              <Coffee className="h-5 w-5" />
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
            <span>Today&apos;s Breaks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakHistory.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No breaks taken today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {breakHistory.map((breakRecord) => (
                <div key={breakRecord.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {breakRecord.breakInTime && formatTime(breakRecord.breakInTime)} - {' '}
                        {breakRecord.breakOutTime && formatTime(breakRecord.breakOutTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(breakRecord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={breakRecord.breakDuration > 30 ? 'destructive' : 'default'}>
                      {formatDuration(breakRecord.breakDuration)}
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