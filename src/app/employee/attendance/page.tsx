'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Coffee,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { attendanceService } from '@/api';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE_APPROVED' | 'WFH_APPROVED';
  checkInTime?: string;
  checkOutTime?: string;
  lunchOutTime?: string;
  lunchInTime?: string;
  hoursWorked?: number;
  remarks?: string;
}

interface AttendanceSummary {
  employeeId: number;
  month: string;
  year: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  leaveDays: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  attendancePercentage: number;
}

export default function MyAttendance() {
  const { employee } = useEmployeeAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const employeeId = employee?.id || 1;

  const filteredRecords = attendanceRecords.filter(record => {
    const statusMatch = statusFilter === 'all' || record.status === statusFilter;
    const dateMatch = !dateFilter || record.date.includes(dateFilter);
    return statusMatch && dateMatch;
  });

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);

      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      // Fetch real attendance data from API
      const [attendanceResponse, summaryResponse] = await Promise.all([
        attendanceService.getByEmployee(employeeId, {
          month: month.toString(),
          year: year.toString()
        }),
        attendanceService.getEmployeeSummary(employeeId, month.toString(), year.toString())
      ]);


      // Set attendance records
      if (Array.isArray(attendanceResponse)) {
        setAttendanceRecords(attendanceResponse as AttendanceRecord[]);
      } else {
        setAttendanceRecords([]);
      }

      // Set summary
      if (summaryResponse && typeof summaryResponse === 'object') {
        setSummary(summaryResponse as unknown as AttendanceSummary);
      } else {
        // Create a basic summary if none available
        const basicSummary: AttendanceSummary = {
          employeeId: employeeId,
          month: month.toString().padStart(2, '0'),
          year: year.toString(),
          totalWorkingDays: 26, // Default working days in a month (exclude Sundays only)
          presentDays: attendanceResponse?.filter((r: unknown) => (r as AttendanceRecord).status === 'PRESENT').length || 0,
          absentDays: attendanceResponse?.filter((r: unknown) => (r as AttendanceRecord).status === 'ABSENT').length || 0,
          halfDays: attendanceResponse?.filter((r: unknown) => (r as AttendanceRecord).status === 'HALF_DAY').length || 0,
          lateDays: attendanceResponse?.filter((r: unknown) => (r as AttendanceRecord).status === 'LATE').length || 0,
          leaveDays: attendanceResponse?.filter((r: unknown) => (r as AttendanceRecord).status === 'LEAVE_APPROVED').length || 0,
          totalHoursWorked: attendanceResponse?.reduce((sum: number, r: unknown) => sum + ((r as AttendanceRecord).hoursWorked || 0), 0) || 0,
          averageHoursPerDay: 0,
          attendancePercentage: 0
        };

        if (basicSummary.totalWorkingDays > 0) {
          basicSummary.averageHoursPerDay = basicSummary.totalHoursWorked / basicSummary.totalWorkingDays;
          basicSummary.attendancePercentage = (basicSummary.presentDays / basicSummary.totalWorkingDays) * 100;
        }

        setSummary(basicSummary);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
      setAttendanceRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);


  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LATE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HALF_DAY':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WFH_APPROVED':
        return <Home className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatStatus = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'LATE':
        return 'Late';
      case 'ABSENT':
        return 'Absent';
      case 'HALF_DAY':
        return 'Half Day';
      case 'LEAVE_APPROVED':
        return 'Leave';
      case 'WFH_APPROVED':
        return 'WFH';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
      case 'LEAVE_APPROVED':
        return 'default';
      case 'LATE':
        return 'secondary';
      case 'ABSENT':
        return 'destructive';
      case 'HALF_DAY':
        return 'outline';
      case 'WFH_APPROVED':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Attendance
          </h1>
          <p className="text-muted-foreground mt-1">Track your attendance and work hours</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Badge>
          <Button variant="outline" className="hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Attendance Rate</span>
                <CheckCircle className="h-5 w-5 text-gray-700" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {Math.round(summary.attendancePercentage)}%
              </div>
              <p className="text-sm text-gray-600/70">
                {summary.presentDays} of {summary.totalWorkingDays} days
              </p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-800 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(summary.attendancePercentage)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Total Hours</span>
                <Clock className="h-5 w-5 text-gray-700" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {summary.totalHoursWorked.toFixed(1)}h
              </div>
              <p className="text-sm text-gray-600/70">
                Avg: {summary.averageHoursPerDay.toFixed(1)}h per day
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
                <span>Absent Days</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {summary.absentDays}
              </div>
              <p className="text-sm text-gray-600/70">
                {summary.lateDays} late days
              </p>
              <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Monitor attendance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Leave Days</span>
                <Home className="h-5 w-5 text-gray-700" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {summary.leaveDays}
              </div>
              <p className="text-sm text-gray-600/70">
                {summary.halfDays} half days
              </p>
              <div className="mt-2 flex items-center space-x-1 text-xs text-gray-600">
                <Coffee className="h-3 w-3" />
                <span>Work-life balance</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enhanced Attendance Summary */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-700" />
              <span>Monthly Overview</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Your attendance summary for this month</p>
          </CardHeader>
          <CardContent className="p-6">
            {summary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-700 mb-1">
                    {summary.presentDays}
                  </div>
                  <p className="text-sm text-gray-700/70">Present Days</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {summary.absentDays}
                  </div>
                  <p className="text-sm text-gray-800/70">Absent Days</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-700 mb-1">
                    {summary.lateDays}
                  </div>
                  <p className="text-sm text-gray-700/70">Late Days</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-700 mb-1">
                    {summary.attendancePercentage.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-700/70">Attendance Rate</p>
                </div>
                <div className="col-span-2 text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {summary.totalHoursWorked.toFixed(1)}h
                  </div>
                  <p className="text-sm text-gray-700/70">Total Hours Worked</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading summary...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Details with Tabs */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Attendance Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Enhanced Filters */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      <SelectItem value="LEAVE_APPROVED">Leave Approved</SelectItem>
                      <SelectItem value="WFH_APPROVED">Work From Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Month</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Specific Date</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                    placeholder="Select date"
                  />
                </div>
              </div>

              {(statusFilter !== 'all' || dateFilter || monthFilter !== new Date().getMonth().toString() || yearFilter !== new Date().getFullYear().toString()) && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-gray-600">
                    {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('');
                      setMonthFilter(new Date().getMonth().toString());
                      setYearFilter(new Date().getFullYear().toString());
                    }}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            <Tabs defaultValue="cards" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="status">By Status</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No attendance records found</p>
                    <p className="text-sm text-gray-500 mt-1">Records will appear here once attendance is tracked</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRecords.map((record) => {
                      const getBorderColor = (status: AttendanceRecord['status']) => {
                        switch (status) {
                          case 'PRESENT': return 'border-l-green-500';
                          case 'LATE': return 'border-l-yellow-500';
                          case 'ABSENT': return 'border-l-red-500';
                          case 'HALF_DAY': return 'border-l-orange-500';
                          case 'LEAVE_APPROVED': return 'border-l-blue-500';
                          case 'WFH_APPROVED': return 'border-l-purple-500';
                          default: return 'border-l-gray-500';
                        }
                      };

                      return (
                      <Card key={record.id} className={`hover:shadow-lg transition-all duration-300 border-l-4 ${getBorderColor(record.status)}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                record.status === 'PRESENT' ? 'bg-green-50' :
                                record.status === 'LATE' ? 'bg-yellow-50' :
                                record.status === 'ABSENT' ? 'bg-red-50' :
                                record.status === 'HALF_DAY' ? 'bg-orange-50' :
                                record.status === 'LEAVE_APPROVED' ? 'bg-blue-50' :
                                record.status === 'WFH_APPROVED' ? 'bg-purple-50' : 'bg-gray-50'
                              }`}>
                                <CalendarDays className={`h-5 w-5 ${
                                  record.status === 'PRESENT' ? 'text-green-600' :
                                  record.status === 'LATE' ? 'text-yellow-600' :
                                  record.status === 'ABSENT' ? 'text-red-600' :
                                  record.status === 'HALF_DAY' ? 'text-orange-600' :
                                  record.status === 'LEAVE_APPROVED' ? 'text-blue-600' :
                                  record.status === 'WFH_APPROVED' ? 'text-purple-600' : 'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {new Date(record.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(record.status)}
                              <Badge variant={getStatusVariant(record.status)} className="text-xs">
                                {formatStatus(record.status)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Time Information */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-700">Check In</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 ml-6">
                                {record.checkInTime || '--:--'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-red-600" />
                                <span className="text-xs font-medium text-gray-700">Check Out</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 ml-6">
                                {record.checkOutTime || '--:--'}
                              </p>
                            </div>
                          </div>

                          {/* Lunch Break */}
                          {(record.lunchOutTime || record.lunchInTime) && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Coffee className="h-4 w-4 text-yellow-600" />
                                <span className="text-xs font-medium text-yellow-800">Lunch Break</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-yellow-700">Out: </span>
                                  <span className="font-medium">{record.lunchOutTime || '--:--'}</span>
                                </div>
                                <div>
                                  <span className="text-yellow-700">In: </span>
                                  <span className="font-medium">{record.lunchInTime || '--:--'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hours Worked */}
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-800">Hours Worked</span>
                              </div>
                              <span className="text-lg font-bold text-blue-900">
                                {record.hoursWorked?.toFixed(1) || '0.0'}h
                              </span>
                            </div>
                            <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((record.hoursWorked || 0) / 8 * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Remarks */}
                          {record.remarks && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-gray-600 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-gray-700">Remarks</span>
                                  <p className="text-xs text-gray-600 mt-1">{record.remarks}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="table" className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No attendance records found</p>
                    <p className="text-sm text-gray-500 mt-1">Records will appear here once attendance is tracked</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium text-gray-700">#</th>
                          <th className="text-left p-3 font-medium text-gray-700">Date</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                          <th className="text-left p-3 font-medium text-gray-700">Check In</th>
                          <th className="text-left p-3 font-medium text-gray-700">Check Out</th>
                          <th className="text-left p-3 font-medium text-gray-700">Hours</th>
                          <th className="text-left p-3 font-medium text-gray-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record, index) => (
                          <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(record.status)}
                                <Badge variant={getStatusVariant(record.status)} className="text-xs">
                                  {formatStatus(record.status)}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="font-medium">
                                  {record.checkInTime || '--:--'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="font-medium">
                                  {record.checkOutTime || '--:--'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <span className="font-medium text-gray-700">
                                {record.hoursWorked?.toFixed(1) || '0.0'}h
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {record.remarks ? (
                                <div className="max-w-32 truncate" title={record.remarks}>
                                  <span className="text-blue-700 italic text-xs">
                                    {record.remarks}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="status" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.filter(r => r.status === 'PRESENT').length}
                    </div>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.filter(r => r.status === 'ABSENT').length}
                    </div>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.filter(r => r.status === 'LATE').length}
                    </div>
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredRecords.filter(r => r.status === 'HALF_DAY').length}
                    </div>
                    <p className="text-sm text-gray-600">Half Day</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Average Hours/Day</h4>
                      <div className="text-2xl font-bold text-gray-900">
                        {summary ? summary.averageHoursPerDay.toFixed(1) : '0'}h
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Total Working Days</h4>
                      <div className="text-2xl font-bold text-gray-900">
                        {summary ? summary.totalWorkingDays : '0'}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Attendance Trend</h4>
                    <p className="text-sm text-gray-600">
                      Your attendance has been {summary && summary.attendancePercentage >= 90 ? 'excellent' : summary && summary.attendancePercentage >= 80 ? 'good' : 'needs improvement'} this month.
                    </p>
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