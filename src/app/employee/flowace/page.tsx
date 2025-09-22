'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Activity,
  BarChart3,
  Zap,
  Target,
  Award,
  Timer,
  Filter
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { flowaceService } from '@/api';
import { toast } from 'sonner';

interface FlowaceRecord {
  id?: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  memberEmail?: string;
  teams?: string;
  date: string;
  workStartTime?: string;
  workEndTime?: string;
  loggedHours?: number;
  activeHours?: number;
  idleHours?: number;
  classifiedHours?: number;
  unclassifiedHours?: number;
  productiveHours?: number;
  unproductiveHours?: number;
  neutralHours?: number;
  availableHours?: number;
  missingHours?: number;
  activityPercentage?: number;
  classifiedPercentage?: number;
  productivityPercentage?: number;
  classifiedBillableDuration?: number;
  classifiedNonBillableDuration?: number;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    name: string;
    employeeCode: string;
    department?: string;
  };
}

export default function FlowaceActivity() {
  const { user } = useUser();
  const [flowaceRecords, setFlowaceRecords] = useState<FlowaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [productivityFilter, setProductivityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [hoursFilter, setHoursFilter] = useState<string>('all');

  const employeeId = 1; // Use default employee ID for now

  const filteredRecords = flowaceRecords.filter(record => {
    const productivityMatch = productivityFilter === 'all' ||
      (productivityFilter === 'high' && (record.productivityPercentage || 0) >= 80) ||
      (productivityFilter === 'medium' && (record.productivityPercentage || 0) >= 60 && (record.productivityPercentage || 0) < 80) ||
      (productivityFilter === 'low' && (record.productivityPercentage || 0) < 60);

    const dateMatch = !dateFilter || record.date.includes(dateFilter);

    // Month/Year filter
    const recordDate = new Date(record.date);
    const monthMatch = monthFilter === new Date().getMonth().toString() ||
      recordDate.getMonth() === parseInt(monthFilter);

    const yearMatch = yearFilter === new Date().getFullYear().toString() ||
      recordDate.getFullYear() === parseInt(yearFilter);

    const hoursMatch = hoursFilter === 'all' ||
      (hoursFilter === 'full' && (record.loggedHours || 0) >= 7) ||
      (hoursFilter === 'partial' && (record.loggedHours || 0) >= 4 && (record.loggedHours || 0) < 7) ||
      (hoursFilter === 'minimal' && (record.loggedHours || 0) < 4);

    return productivityMatch && dateMatch && monthMatch && yearMatch && hoursMatch;
  });

  const fetchFlowaceData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await flowaceService.getByEmployee(employeeId);

      if (response.success && Array.isArray(response.records)) {
        setFlowaceRecords(response.records);
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Handle case where API returns { data: [...] }
        const data = (response as { data: unknown }).data;
        if (Array.isArray(data)) {
          setFlowaceRecords(data);
        } else {
          setFlowaceRecords([]);
        }
      } else {
        setFlowaceRecords([]);
      }

        const recordsToCheck = response.success && Array.isArray(response.records) ? response.records :
                           (response && 'data' in response && Array.isArray((response as { data: unknown }).data)) ? (response as { data: FlowaceRecord[] }).data : [];

        if (recordsToCheck.length === 0) {
          // Try to get ALL records to see if there's any flowace data at all
          try {
            const allRecordsResponse = await flowaceService.getAll();

            if (allRecordsResponse.success && allRecordsResponse.records.length > 0) {
              toast.info(`No activity data found for ${user?.fullName || 'your account'}. There are ${allRecordsResponse.records.length} records for other employees in the system.`, {
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
    } catch {
      toast.error('Failed to load activity data', {
        description: "There was an error connecting to the server. Please try again later.",
        duration: 5000
      });
      setFlowaceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, user?.fullName]);

  useEffect(() => {
    fetchFlowaceData();
  }, [fetchFlowaceData]);

  // Calculate summary statistics
  const summary = {
    totalSessions: filteredRecords.length,
    totalHours: filteredRecords.reduce((sum, record) => sum + (record.loggedHours || 0), 0),
    avgProductivity: filteredRecords.length > 0 ?
      filteredRecords.reduce((sum, record) => sum + (record.productivityPercentage || 0), 0) / filteredRecords.length : 0,
    avgActivity: filteredRecords.length > 0 ?
      filteredRecords.reduce((sum, record) => sum + (record.activityPercentage || 0), 0) / filteredRecords.length : 0,
    totalActiveHours: filteredRecords.reduce((sum, record) => sum + (record.activeHours || 0), 0),
    totalProductiveHours: filteredRecords.reduce((sum, record) => sum + (record.productiveHours || 0), 0),
    peakProductivity: filteredRecords.length > 0 ? Math.max(...filteredRecords.map(r => r.productivityPercentage || 0)) : 0,
    consistentDays: filteredRecords.filter(r => (r.productivityPercentage || 0) >= 70).length
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return timeStr.split(':').slice(0, 2).join(':');
  };

  const formatHoursMinutesSeconds = (hours: number) => {
    if (hours === undefined || hours === null || hours === 0) {
      return '00:00:00';
    }

    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDecimal = (value: number, decimals: number = 3) => {
    return Number(value).toFixed(decimals);
  };

  const getStatusInfo = (record: FlowaceRecord) => {
    const totalHours = record.loggedHours || record.activeHours || 0;
    const productivityScore = record.productivityPercentage || 0;

    if (totalHours < 4) {
      return { text: 'Low Hours', color: 'bg-red-100 text-red-800' };
    } else if (totalHours >= 8 && productivityScore > 80) {
      return { text: 'Excellent', color: 'bg-emerald-100 text-emerald-800' };
    } else if (totalHours >= 6 && productivityScore > 60) {
      return { text: 'Good', color: 'bg-green-100 text-green-800' };
    } else if (totalHours >= 4 && productivityScore > 40) {
      return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Needs Improvement', color: 'bg-orange-100 text-orange-800' };
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Activity Analytics
          </h1>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg Productivity</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.avgProductivity.toFixed(1)}%</p>
                  <p className="text-gray-500 text-sm">{summary.totalSessions} sessions tracked</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalHours.toFixed(1)}h</p>
                  <p className="text-gray-500 text-sm">{summary.totalActiveHours.toFixed(1)}h active time</p>
                </div>
                <Timer className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Peak Performance</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.peakProductivity.toFixed(1)}%</p>
                  <p className="text-gray-500 text-sm">{summary.consistentDays} consistent days</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Activity Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.avgActivity.toFixed(1)}%</p>
                  <p className="text-gray-500 text-sm">{summary.totalProductiveHours.toFixed(1)}h productive</p>
                </div>
                <Zap className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Productivity</label>
                <Select value={productivityFilter} onValueChange={setProductivityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="high">High (≥80%)</SelectItem>
                    <SelectItem value="medium">Medium (60-79%)</SelectItem>
                    <SelectItem value="low">Low (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Hours Worked</label>
                <Select value={hoursFilter} onValueChange={setHoursFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hours</SelectItem>
                    <SelectItem value="full">Full Day (≥7h)</SelectItem>
                    <SelectItem value="partial">Partial Day (4-7h)</SelectItem>
                    <SelectItem value="minimal">Minimal (&lt;4h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Month</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 5}, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Specific Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                  placeholder="Select date"
                />
              </div>
            </div>

            {(productivityFilter !== 'all' || hoursFilter !== 'all' || dateFilter || monthFilter !== new Date().getMonth().toString() || yearFilter !== new Date().getFullYear().toString()) && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Badge variant="outline" className="px-3 py-1">
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProductivityFilter('all');
                    setHoursFilter('all');
                    setDateFilter('');
                    setMonthFilter(new Date().getMonth().toString());
                    setYearFilter(new Date().getFullYear().toString());
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Records Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Daily Activity Sessions</h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {filteredRecords.length} records
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your activity data...</p>
            </div>
          ) : flowaceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Activity Data</h3>
              <p className="text-gray-500">Your activity tracking data will appear here once uploaded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold">Date</th>
                    <th className="text-left py-3 px-3 font-semibold" title="Start time → End time of work tracking">Work Session</th>
                    <th className="text-left py-3 px-3 font-semibold" title="Total time tracked by Flowace (Active + Idle)">Total Logged</th>
                    <th className="text-left py-3 px-3 font-semibold" title="Active work time vs idle/away time">Active/Idle</th>
                    <th className="text-left py-3 px-3 font-semibold" title="Productive work hours and percentage score">Productivity</th>
                    <th className="text-left py-3 px-3 font-semibold" title="Mouse/keyboard activity level percentage">Activity %</th>
                    <th className="text-left py-3 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const statusInfo = getStatusInfo(record);
                    return (
                      <tr key={record.id || index} className="border-b hover:bg-gray-50">
                        {/* Date */}
                        <td className="py-3 px-3">
                          <div className="text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>

                        {/* Work Hours */}
                        <td className="py-3 px-3">
                          <div className="text-sm text-gray-900">
                            {formatTime(record.workStartTime)} - {formatTime(record.workEndTime)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            {record.missingHours && record.missingHours > 0 ? (
                              <>
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                                {formatHoursMinutesSeconds(record.missingHours)} missing
                              </>
                            ) : record.availableHours ? (
                              <>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
                                {formatHoursMinutesSeconds(record.availableHours)} expected
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                Full time logged
                              </>
                            )}
                          </div>
                        </td>

                        {/* Logged Hours */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-blue-600 text-sm" title="Total time tracked by Flowace software">
                            {formatHoursMinutesSeconds(
                              record.loggedHours !== undefined && record.loggedHours !== null
                                ? record.loggedHours
                                : (record.activeHours || 0)
                            )}
                          </div>
                          <div className="text-xs text-gray-400" title="Decimal hours from CSV">
                            {formatDecimal(
                              record.loggedHours !== undefined && record.loggedHours !== null
                                ? record.loggedHours
                                : (record.activeHours || 0)
                            )}h
                          </div>
                          {record.activeHours !== undefined && record.activeHours !== null && (
                            <div className="text-xs text-gray-500">
                              {formatHoursMinutesSeconds(record.activeHours)} active
                            </div>
                          )}
                        </td>

                        {/* Active/Idle Time */}
                        <td className="py-3 px-3">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              Active: {formatHoursMinutesSeconds(record.activeHours || 0)}
                            </div>
                            <div className="flex items-center text-orange-600">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                              Idle: {formatHoursMinutesSeconds(record.idleHours || 0)}
                            </div>
                          </div>
                        </td>

                        {/* Productivity */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    (record.productivityPercentage || 0) >= 80
                                      ? 'bg-green-600'
                                      : (record.productivityPercentage || 0) >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, (record.productivityPercentage || 0))}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">
                                {(record.productivityPercentage || 0).toFixed(2)}%
                              </span>
                            </div>
                            {(record.productiveHours || record.unproductiveHours) && (
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                {record.productiveHours && record.productiveHours > 0 && (
                                  <span className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                    {formatHoursMinutesSeconds(record.productiveHours)}
                                  </span>
                                )}
                                {record.unproductiveHours && record.unproductiveHours > 0 && (
                                  <span className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                                    {formatHoursMinutesSeconds(record.unproductiveHours)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Activity % */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    (record.activityPercentage || 0) >= 80
                                      ? 'bg-blue-600'
                                      : (record.activityPercentage || 0) >= 50
                                      ? 'bg-blue-400'
                                      : 'bg-gray-400'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, record.activityPercentage || 0)}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">
                                {(record.activityPercentage || 0).toFixed(2)}%
                              </span>
                            </div>
                            {record.classifiedPercentage && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></span>
                                {(record.classifiedPercentage).toFixed(2)}% classified
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <Badge className={statusInfo.color} variant="secondary">
                            {statusInfo.text}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}