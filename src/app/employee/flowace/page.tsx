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
  Clock,
  TrendingUp,
  Zap,
  Target,
  Award,
  Timer,
  Play,
  Brain,
  Users,
  Calendar,
  Filter,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
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
  const { employee } = useEmployeeAuth();
  const [flowaceRecords, setFlowaceRecords] = useState<FlowaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [productivityFilter, setProductivityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [hoursFilter, setHoursFilter] = useState<string>('all');

  const employeeId = employee?.id || 1;

  const filteredRecords = flowaceRecords.filter(record => {
    const productivityMatch = productivityFilter === 'all' ||
      (productivityFilter === 'high' && (record.productivityPercentage || 0) >= 80) ||
      (productivityFilter === 'medium' && (record.productivityPercentage || 0) >= 60 && (record.productivityPercentage || 0) < 80) ||
      (productivityFilter === 'low' && (record.productivityPercentage || 0) < 60);

    const dateMatch = !dateFilter || record.date.includes(dateFilter);

    const hoursMatch = hoursFilter === 'all' ||
      (hoursFilter === 'full' && (record.loggedHours || 0) >= 7) ||
      (hoursFilter === 'partial' && (record.loggedHours || 0) >= 4 && (record.loggedHours || 0) < 7) ||
      (hoursFilter === 'minimal' && (record.loggedHours || 0) < 4);

    return productivityMatch && dateMatch && hoursMatch;
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
    } catch {
      toast.error('Failed to load activity data', {
        description: "There was an error connecting to the server. Please try again later.",
        duration: 5000
      });
      setFlowaceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, employee?.name]);

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

  const getProductivityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-gray-900 bg-gray-100 border-gray-300';
    if (percentage >= 60) return 'text-gray-700 bg-gray-50 border-gray-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getProductivityIcon = (percentage: number) => {
    if (percentage >= 80) return <Target className="h-4 w-4 text-gray-900" />;
    if (percentage >= 60) return <TrendingUp className="h-4 w-4 text-gray-700" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Activity Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">Monitor your productivity, optimize your workflow</p>
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
                <Target className="h-12 w-12 text-gray-400" />
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
                <Timer className="h-12 w-12 text-gray-400" />
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
                <Award className="h-12 w-12 text-gray-400" />
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
                <Zap className="h-12 w-12 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
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

        {/* Activity Records */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              Daily Activity Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your activity data...</p>
              </div>
            ) : flowaceRecords.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Activity Data</h3>
                <p className="text-gray-500">Your activity tracking data will appear here once uploaded</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((record, index) => (
                  <Card key={record.id || index} className={`hover:shadow-md transition-all duration-300 border-l-4 ${
                    (record.productivityPercentage || 0) >= 80 ? 'border-l-gray-900' :
                    (record.productivityPercentage || 0) >= 60 ? 'border-l-gray-600' : 'border-l-gray-400'
                  } bg-white border border-gray-200`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-full bg-gray-100">
                            <Calendar className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {format(new Date(record.date), 'MMM d')}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {format(new Date(record.date), 'EEEE')}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${getProductivityColor(record.productivityPercentage || 0)}`}>
                          <div className="flex items-center space-x-1">
                            {getProductivityIcon(record.productivityPercentage || 0)}
                            <span className="text-xs font-medium">
                              {(record.productivityPercentage || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Work Schedule */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-800">Work Schedule</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-medium">
                            {record.workStartTime || 'N/A'} - {record.workEndTime || 'N/A'}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {record.loggedHours?.toFixed(1) || '0.0'}h logged
                          </span>
                        </div>
                      </div>

                      {/* Activity Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-1 mb-1">
                            <Play className="h-3 w-3 text-gray-600" />
                            <span className="text-xs font-medium text-gray-800">Active</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {record.activeHours?.toFixed(1) || '0.0'}h
                          </p>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex items-center space-x-1 mb-1">
                            <Brain className="h-3 w-3 text-gray-700" />
                            <span className="text-xs font-medium text-gray-800">Productive</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {record.productiveHours?.toFixed(1) || '0.0'}h
                          </p>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Productivity</span>
                            <span className="text-xs text-gray-600">{(record.productivityPercentage || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                (record.productivityPercentage || 0) >= 80 ? 'bg-gray-900' :
                                (record.productivityPercentage || 0) >= 60 ? 'bg-gray-600' : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.min(record.productivityPercentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Activity</span>
                            <span className="text-xs text-gray-600">{(record.activityPercentage || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-700 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(record.activityPercentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Team Info */}
                      {record.teams && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Team</span>
                            <Badge variant="outline" className="text-xs">
                              {record.teams}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Performance Badge */}
                      {(record.productivityPercentage || 0) >= 90 && (
                        <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-gray-700" />
                            <span className="text-sm font-medium text-gray-800">Exceptional Performance!</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}