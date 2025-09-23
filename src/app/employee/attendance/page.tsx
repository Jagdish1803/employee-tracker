'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  Filter,
  BarChart3,
  Target,
  Award,
  Activity,
  Timer
} from 'lucide-react';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { toast } from 'sonner';
import { AttendanceRecord as APIAttendanceRecord } from '@/types';
import { useEmployeeCalendar, useEmployeeSummary } from '@/hooks/useAttendanceQuery';

interface AttendanceSummary {
  attendancePercentage: number;
  presentDays: number;
  totalWorkingDays: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
}

interface AttendanceRecord extends APIAttendanceRecord {
  breakInTime?: string;
  breakOutTime?: string;
  lunchBreakIn?: string;
  lunchBreakOut?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  [key: string]: unknown;
}


export default function MyAttendance() {
  const { employee, loading: employeeLoading, error: employeeError, employeeId } = useEmployeeData();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>(new Date().getMonth().toString());
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  // Calculate current month/year for React Query
  const month = (parseInt(monthFilter) + 1).toString();
  const year = yearFilter;

  // Use React Query hooks for optimized data fetching
  const {
    data: calendarData,
    isLoading: calendarLoading,
    error: calendarError
  } = useEmployeeCalendar(employeeId || 0, month, year);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError
  } = useEmployeeSummary(employeeId || 0, month, year);

  // Handle loading and error states
  const loading = calendarLoading || summaryLoading || employeeLoading;

  // Process calendar data into attendance records
  React.useEffect(() => {
    if (calendarData && Array.isArray(calendarData)) {
      setAttendanceRecords(calendarData as AttendanceRecord[]);
    } else if (calendarData && 'data' in calendarData && Array.isArray((calendarData as { data: unknown }).data)) {
      setAttendanceRecords((calendarData as { data: AttendanceRecord[] }).data);
    } else {
      setAttendanceRecords([]);
    }
  }, [calendarData]);

  // Show error notifications
  React.useEffect(() => {
    if (calendarError || summaryError) {
      toast.error('Failed to load attendance data');
    }
  }, [calendarError, summaryError]);

  const filteredRecords = attendanceRecords.filter(record => {
    const statusMatch = statusFilter === 'all' || record.status === statusFilter;
    const dateMatch = !dateFilter || record.date.includes(dateFilter);
    return statusMatch && dateMatch;
  });

  // Helper function to get break in time with fallback logic
  const getBreakInTime = (record: AttendanceRecord) => {
    return record.lunchOutTime || record.breakOutTime || record.breakStartTime || record.lunchBreakOut || 'Not recorded';
  };

  // Helper function to get break out time with fallback logic
  const getBreakOutTime = (record: AttendanceRecord) => {
    return record.lunchInTime || record.breakInTime || record.breakEndTime || record.lunchBreakIn || 'Not recorded';
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

  const formatStatus = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'ABSENT':
        return 'Absent';
      case 'LATE':
        return 'Late';
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

  // Show error if employee data failed to load
  if (employeeError) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <CalendarDays className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">Access Error</h3>
            <p className="text-gray-500">{employeeError}</p>
            <p className="text-sm text-gray-400 mt-2">Please contact your administrator to verify your employee code.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if employee data is still loading
  if (employeeLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="w-full space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
            My Attendance{employee && (
              <span className="hidden sm:inline"> - {employee.name}</span>
            )}
          </h1>
        </div>

        {/* Key Metrics Cards */}
        {summary && (
          <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Attendance Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round((summary as unknown as AttendanceSummary)?.attendancePercentage || 0)}%</p>
                    <p className="text-gray-500 text-sm">{(summary as unknown as AttendanceSummary)?.presentDays || 0} of {(summary as unknown as AttendanceSummary)?.totalWorkingDays || 0} days</p>
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
                    <p className="text-3xl font-bold text-gray-900">{((summary as unknown as AttendanceSummary)?.totalHoursWorked || 0).toFixed(1)}h</p>
                    <p className="text-gray-500 text-sm">Avg: {((summary as unknown as AttendanceSummary)?.averageHoursPerDay || 0).toFixed(1)}h/day</p>
                  </div>
                  <Timer className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Present Days</p>
                    <p className="text-3xl font-bold text-gray-900">{(summary as unknown as AttendanceSummary)?.presentDays || 0}</p>
                    <p className="text-gray-500 text-sm">Including {(summary as unknown as AttendanceSummary)?.lateDays || 0} late</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Absent Days</p>
                    <p className="text-3xl font-bold text-gray-900">{(summary as unknown as AttendanceSummary)?.absentDays || 0}</p>
                    <p className="text-gray-500 text-sm">{(summary as unknown as AttendanceSummary)?.leaveDays || 0} approved leaves</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
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
                />
              </div>
            </div>

            {(statusFilter !== 'all' || dateFilter || monthFilter !== new Date().getMonth().toString() || yearFilter !== new Date().getFullYear().toString()) && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Badge variant="outline" className="px-3 py-1">
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
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

        {/* Attendance Records Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {filteredRecords.length} records
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your attendance data...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Yet</h3>
              <p className="text-gray-500">Your attendance records will appear here once you start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Break In
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Break Out
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours Worked
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusVariant(record.status)} className="text-xs">
                          {formatStatus(record.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.checkInTime || 'Not recorded'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOutTime || 'Not recorded'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {getBreakInTime(record)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {getBreakOutTime(record)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.hoursWorked?.toFixed(1) || '0.0'}h
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}