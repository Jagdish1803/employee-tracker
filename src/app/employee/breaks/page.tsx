'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coffee,
  Play,
  Square,
  Clock,
  Timer,
  AlertTriangle,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Break {
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

interface BreakSummary {
  totalBreaks: number;
  totalDuration: number;
  averageDuration: number;
  longestBreak: number;
  warningsReceived: number;
}

export default function BreakTracker() {
  const [currentBreak, setCurrentBreak] = useState<Break | null>(null);
  const [breakHistory, setBreakHistory] = useState<Break[]>([]);
  const [summary, setSummary] = useState<BreakSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock employee ID
  const employeeId = 1;

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

  useEffect(() => {
    fetchBreakData();
  }, []);

  const fetchBreakData = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockBreaks: Break[] = [
        {
          id: 1,
          employeeId: 1,
          breakDate: new Date().toISOString().split('T')[0],
          breakInTime: '10:30:00',
          breakOutTime: '10:45:00',
          breakDuration: 15,
          isActive: false,
          warningSent: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          employeeId: 1,
          breakDate: new Date().toISOString().split('T')[0],
          breakInTime: '14:00:00',
          breakOutTime: '14:20:00',
          breakDuration: 20,
          isActive: false,
          warningSent: false,
          createdAt: new Date().toISOString()
        }
      ];

      const mockSummary: BreakSummary = {
        totalBreaks: 15,
        totalDuration: 285,
        averageDuration: 19,
        longestBreak: 35,
        warningsReceived: 2
      };

      setBreakHistory(mockBreaks);
      setSummary(mockSummary);

      // Check if there's an active break
      const activeBreak = mockBreaks.find(b => b.isActive);
      if (activeBreak) {
        setCurrentBreak(activeBreak);
      }
    } catch (error) {
      console.error('Error fetching break data:', error);
    }
  };

  const handleBreakIn = async () => {
    if (currentBreak?.isActive) {
      toast.error('You are already on a break');
      return;
    }

    try {
      setLoading(true);

      // Mock API call
      const newBreak: Break = {
        id: Date.now(),
        employeeId,
        breakDate: new Date().toISOString().split('T')[0],
        breakInTime: new Date().toTimeString().slice(0, 8),
        breakDuration: 0,
        isActive: true,
        warningSent: false,
        createdAt: new Date().toISOString()
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

      const now = new Date();
      const breakInTime = new Date(`${currentBreak.breakDate}T${currentBreak.breakInTime}`);
      const duration = Math.floor((now.getTime() - breakInTime.getTime()) / (1000 * 60));

      const updatedBreak: Break = {
        ...currentBreak,
        breakOutTime: now.toTimeString().slice(0, 8),
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
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Breaks</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBreaks}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">All breaks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.averageDuration)}</div>
              <p className="text-xs text-muted-foreground">Per break</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Longest</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.longestBreak)}</div>
              <p className="text-xs text-muted-foreground">Single break</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.warningsReceived}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
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