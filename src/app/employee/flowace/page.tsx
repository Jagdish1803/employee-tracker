'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  const [productivityFilter, setProductivityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const employeeId = employee?.id || 1;

  const filteredRecords = flowaceRecords.filter(record => {
    const productivityMatch = productivityFilter === 'all' ||
      (productivityFilter === 'high' && (record.productivityPercentage || 0) >= 80) ||
      (productivityFilter === 'medium' && (record.productivityPercentage || 0) >= 60 && (record.productivityPercentage || 0) < 80) ||
      (productivityFilter === 'low' && (record.productivityPercentage || 0) < 60);

    const dateMatch = !dateFilter || record.date.includes(dateFilter);
    return productivityMatch && dateMatch;
  });

  const fetchFlowaceData = useCallback(async () => {
    try {
      setLoading(true);

      // First try to get employee-specific records
      const response = await flowaceService.getByEmployee(employeeId);

      if (response.success && Array.isArray(response.records)) {

        if (response.records.length === 0) {
          // Try to get ALL records to see if there's any flowace data at all
          try {
            const allRecordsResponse = await flowaceService.getAll();

            if (allRecordsResponse.success && allRecordsResponse.records.length > 0) {
              toast.info(`No activity data found for ${employee?.name || 'your account'}. There are ${allRecordsResponse.records.length} records for other employees in the system.`, {
                description: "Your activity data might not have been uploaded yet or may be associated with a different name.",
                duration: 6000
              });
            } else {
              toast.info('No activity data available', {
                description: "No flowace data has been uploaded to the system yet. Please contact your administrator to upload activity tracking data.",
                duration: 6000
              });
            }
          } catch {
            toast.info('No activity data found', {
              description: "Unable to load activity tracking data for your account.",
              duration: 4000
            });
          }
        }

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
    } catch {
      toast.error('Failed to load activity data', {
        description: "There was an error connecting to the server. Please try again later.",
        duration: 5000
      });
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
          <h1 className="text-3xl font-bold text-gray-900">
            Activity Tracking
          </h1>
          <p className="text-muted-foreground mt-1">Monitor your daily productivity and activity levels</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
            <Gauge className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {summary.avgProductivity}% Avg
            </span>
          </div>
          <Button variant="outline" className="hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Total Active Hours</span>
              <Clock className="h-5 w-5 text-gray-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {formatHours(summary.totalActiveHours)}
            </div>
            <p className="text-sm text-gray-600/70">
              Across {summary.totalWorkingDays} working days
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>This month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Avg Productivity</span>
              <Target className="h-5 w-5 text-gray-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {summary.avgProductivity}%
            </div>
            <p className="text-sm text-gray-600/70">
              Daily productivity score
            </p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-800 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.avgProductivity, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Working Days</span>
              <CalendarIcon className="h-5 w-5 text-gray-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {summary.totalWorkingDays}
            </div>
            <p className="text-sm text-gray-600/70">
              Days with recorded activity
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
              <BarChart3 className="h-3 w-3" />
              <span>Activity tracked</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Avg Daily Hours</span>
              <Timer className="h-5 w-5 text-gray-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {formatHours(summary.avgActiveHours)}
            </div>
            <p className="text-sm text-gray-600/70">
              Per working day average
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
              <Zap className="h-3 w-3" />
              <span>Consistent tracking</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productivity Analytics */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
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
                    <div className="text-3xl font-bold text-gray-600 mb-1">
                      {(flowaceRecords.reduce((sum, record) => sum + (record.productivityPercentage || 0), 0) / flowaceRecords.length).toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600/70">Avg Productivity</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600 mb-1">
                      {flowaceRecords.reduce((sum, record) => sum + (record.loggedHours || 0), 0).toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600/70">Total Hours</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Recent Activity Trend</h4>
                  <div className="space-y-2">
                    {flowaceRecords.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            (record.productivityPercentage ?? 0) >= 80 ? 'bg-gray-800' :
                            (record.productivityPercentage ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{format(new Date(record.date), 'MMM d')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{record.productivityPercentage ?? 0}%</div>
                          <div className="text-xs text-gray-500">{record.loggedHours ?? 0}h</div>
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

        {/* Activity Analysis with Tabs */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <label htmlFor="productivity-filter" className="text-sm font-medium text-gray-700">
                  Productivity:
                </label>
                <Select value={productivityFilter} onValueChange={setProductivityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High (≥80%)</SelectItem>
                    <SelectItem value="medium">Medium (60-79%)</SelectItem>
                    <SelectItem value="low">Low (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                  Date:
                </label>
                <Input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading activity data...</p>
              </div>
            ) : selectedRecord ? (
              <div className="space-y-6">
                {/* Productivity Score */}
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600 mb-1">
                    {selectedRecord.productivityPercentage ?? 0}%
                  </div>
                  <p className="text-sm text-gray-600/70">Productivity Score</p>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gray-800 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedRecord.productivityPercentage ?? 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Time Details */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Work Hours</span>
                    </div>
                    <span className="font-bold text-gray-600">
                      {selectedRecord.workStartTime} - {selectedRecord.workEndTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Active Hours</span>
                    </div>
                    <span className="font-bold text-gray-600">
                      {formatHours(selectedRecord.activeHours || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Productive Hours</span>
                    </div>
                    <span className="font-bold text-gray-600">
                      {formatHours(selectedRecord.productiveHours || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Total Logged</span>
                    </div>
                    <span className="font-bold text-gray-600">
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
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <div className="space-y-3">
                  {filteredRecords.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          (record.productivityPercentage ?? 0) >= 80 ? 'bg-gray-800' :
                          (record.productivityPercentage ?? 0) >= 60 ? 'bg-gray-600' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-gray-600">{record.loggedHours ?? 0} hours tracked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{record.productivityPercentage ?? 0}%</p>
                        <p className="text-sm text-gray-600">Productivity</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Weekly Average</h4>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.length > 0 ? (filteredRecords.reduce((sum, record) => sum + (record.productivityPercentage || 0), 0) / filteredRecords.length).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Total Sessions</h4>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.length}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Peak Performance</h4>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.length > 0 ? Math.max(...filteredRecords.map(r => r.productivityPercentage || 0)) : 0}%
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Hours Tracked</h4>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.reduce((sum, record) => sum + (record.loggedHours || 0), 0).toFixed(1)}h
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

