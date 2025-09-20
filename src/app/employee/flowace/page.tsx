'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Activity,
  Download,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  Timer,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Gauge
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { flowaceService, FlowaceRecord } from '@/api';
import { toast } from 'sonner';

export default function FlowaceActivity() {
  const { employee } = useEmployeeAuth();
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
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
  }, []);


  const getSelectedDateRecord = () => {
    // Return the most recent record if available
    if (flowaceRecords.length === 0) return null;
    return flowaceRecords[0];
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Activity Tracking
          </h1>
          <p className="text-muted-foreground mt-1">Monitor your daily productivity and activity levels</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
            <Gauge className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {summary.avgProductivity}% Avg
            </span>
          </div>
          <Button variant="outline" className="hover:bg-purple-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-blue-700">
              <span>Total Active Hours</span>
              <Clock className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatHours(summary.totalActiveHours)}
            </div>
            <p className="text-sm text-blue-600/70">
              Across {summary.totalWorkingDays} working days
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
              <TrendingUp className="h-3 w-3" />
              <span>This month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-green-700">
              <span>Avg Productivity</span>
              <Target className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {summary.avgProductivity}%
            </div>
            <p className="text-sm text-green-600/70">
              Daily productivity score
            </p>
            <div className="mt-2 w-full bg-green-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.avgProductivity, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-purple-700">
              <span>Working Days</span>
              <CalendarIcon className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {summary.totalWorkingDays}
            </div>
            <p className="text-sm text-purple-600/70">
              Days with recorded activity
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-purple-600">
              <BarChart3 className="h-3 w-3" />
              <span>Activity tracked</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-orange-700">
              <span>Avg Daily Hours</span>
              <Timer className="h-5 w-5 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {formatHours(summary.avgActiveHours)}
            </div>
            <p className="text-sm text-orange-600/70">
              Per working day average
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600">
              <Zap className="h-3 w-3" />
              <span>Consistent tracking</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productivity Analytics */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Productivity Analytics</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your performance metrics overview
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {flowaceRecords.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {(flowaceRecords.reduce((sum, record) => sum + (record.productivityPercentage || 0), 0) / flowaceRecords.length).toFixed(1)}%
                    </div>
                    <p className="text-sm text-green-600/70">Avg Productivity</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {flowaceRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0).toFixed(1)}h
                    </div>
                    <p className="text-sm text-blue-600/70">Total Hours</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Recent Activity Trend</h4>
                  <div className="space-y-2">
                    {flowaceRecords.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            (record.productivityPercentage ?? 0) >= 80 ? 'bg-green-500' :
                            (record.productivityPercentage ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{format(new Date(record.date), 'MMM d')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{record.productivityPercentage ?? 0}%</div>
                          <div className="text-xs text-gray-500">{record.totalHours ?? 0}h</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No activity data available</p>
                <p className="text-sm text-muted-foreground">
                  Activity tracking data will appear here once available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Selected Date Details */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <span>
                {selectedRecord ? format(new Date(selectedRecord.date), 'EEEE, MMMM d, yyyy') : 'Latest Activity'}
              </span>
            </CardTitle>
            {selectedRecord && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  {(selectedRecord.productivityPercentage ?? 0) >= 80 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (selectedRecord.productivityPercentage ?? 0) >= 60 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {(selectedRecord.productivityPercentage ?? 0) >= 80 ? 'High Performance' :
                     (selectedRecord.productivityPercentage ?? 0) >= 60 ? 'Good Performance' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading activity data...</p>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-6">
                {/* Productivity Score */}
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {selectedRecord.productivityPercentage ?? 0}%
                  </div>
                  <p className="text-sm text-green-600/70">Productivity Score</p>
                  <div className="mt-2 w-full bg-green-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedRecord.productivityPercentage ?? 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Time Details */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Work Hours</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {selectedRecord.workStartTime} - {selectedRecord.workEndTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Active Hours</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatHours(selectedRecord.activeHours || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Productive Hours</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {formatHours(selectedRecord.productiveHours || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Total Logged</span>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatHours(selectedRecord.loggedHours || 0)}
                    </span>
                  </div>
                </div>

                {/* Performance Insight */}
                <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">Performance Insight</span>
                  </div>
                  <p className="text-sm text-indigo-700">
                    {(selectedRecord.productivityPercentage ?? 0) >= 80
                      ? "Excellent work! You're maintaining high productivity levels."
                      : (selectedRecord.productivityPercentage ?? 0) >= 60
                      ? "Good performance! Consider optimizing your workflow for better results."
                      : "Room for improvement. Try to minimize distractions and focus on core tasks."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">No activity recorded</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No productivity data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Activity */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span>Recent Activity</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Performance overview for the last 7 days</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading recent activity...</p>
            </div>
          ) : flowaceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg font-medium">No activity records found</p>
              <p className="text-sm text-muted-foreground mt-1">Activity data will appear here once tracked</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {flowaceRecords.slice(0, 7).reverse().map((record, index) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-lg font-semibold text-gray-900">
                          {format(new Date(record.date), 'EEE, MMM d')}
                        </div>
                        <div className="flex items-center space-x-1">
                          {(record.productivityPercentage ?? 0) >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (record.productivityPercentage ?? 0) >= 60 ? (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {record.productivityPercentage}% productivity
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">Work:</span>
                          <span className="font-medium">
                            {record.workStartTime} - {record.workEndTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Active:</span>
                          <span className="font-medium text-green-600">
                            {formatHours(record.activeHours || 0)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          <span className="text-muted-foreground">Productive:</span>
                          <span className="font-medium text-purple-600">
                            {formatHours(record.productiveHours || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar for productivity */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Productivity Score</span>
                          <span>{record.productivityPercentage ?? 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (record.productivityPercentage ?? 0) >= 80
                                ? 'bg-green-500'
                                : (record.productivityPercentage ?? 0) >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${record.productivityPercentage ?? 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="text-xs text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (record.productivityPercentage ?? 0) >= 80
                          ? 'bg-green-100 text-green-700'
                          : (record.productivityPercentage ?? 0) >= 60
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(record.productivityPercentage ?? 0) >= 80 ? 'High' :
                         (record.productivityPercentage ?? 0) >= 60 ? 'Good' : 'Low'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {flowaceRecords.length > 7 && (
                <div className="p-4 bg-gray-50 text-center">
                  <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-100">
                    View All {flowaceRecords.length} Records
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}