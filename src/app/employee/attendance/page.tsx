'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  AlertTriangle,
  Coffee,
  Filter,
  BarChart3,
  Target,
  Award,
  Activity,
  MapPin,
  Timer
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
          employeeId,
          month: month.toString(),
          year: year.toString(),
          totalWorkingDays: 26,
          presentDays: attendanceRecords.filter(r => ['PRESENT', 'LATE', 'WFH_APPROVED'].includes(r.status)).length,
          absentDays: attendanceRecords.filter(r => r.status === 'ABSENT').length,
          halfDays: attendanceRecords.filter(r => r.status === 'HALF_DAY').length,
          lateDays: attendanceRecords.filter(r => r.status === 'LATE').length,
          leaveDays: attendanceRecords.filter(r => r.status === 'LEAVE_APPROVED').length,
          totalHoursWorked: attendanceRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
          averageHoursPerDay: 0,
          attendancePercentage: 0
        };

        if (basicSummary.presentDays > 0) {
          basicSummary.averageHoursPerDay = basicSummary.totalHoursWorked / basicSummary.presentDays;
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
  }, [employeeId, attendanceRecords]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Attendance Dashboard
          </h1>
          <p className="text-lg text-gray-600">Track your presence, monitor your progress</p>
        </div>

        {/* Key Metrics Cards */}
        {summary && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Attendance Rate</p>
                    <p className="text-3xl font-bold">{Math.round(summary.attendancePercentage)}%</p>
                    <p className="text-green-100 text-sm">{summary.presentDays} of {summary.totalWorkingDays} days</p>
                  </div>
                  <Target className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Hours</p>
                    <p className="text-3xl font-bold">{summary.totalHoursWorked.toFixed(1)}h</p>
                    <p className="text-blue-100 text-sm">Avg: {summary.averageHoursPerDay.toFixed(1)}h/day</p>
                  </div>
                  <Timer className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Present Days</p>
                    <p className="text-3xl font-bold">{summary.presentDays}</p>
                    <p className="text-purple-100 text-sm">Including {summary.lateDays} late</p>
                  </div>
                  <Award className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Absent Days</p>
                    <p className="text-3xl font-bold">{summary.absentDays}</p>
                    <p className="text-orange-100 text-sm">{summary.leaveDays} approved leaves</p>
                  </div>
                  <Activity className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Smart Filters
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

        {/* Beautiful Attendance Records */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <Card key={record.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${getBorderColor(record.status)} bg-white/90 backdrop-blur-sm`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-full ${
                              record.status === 'PRESENT' ? 'bg-green-50' :
                              record.status === 'LATE' ? 'bg-yellow-50' :
                              record.status === 'ABSENT' ? 'bg-red-50' :
                              record.status === 'HALF_DAY' ? 'bg-orange-50' :
                              record.status === 'LEAVE_APPROVED' ? 'bg-blue-50' :
                              record.status === 'WFH_APPROVED' ? 'bg-purple-50' : 'bg-gray-50'
                            }`}>
                              <CalendarDays className={`h-6 w-6 ${
                                record.status === 'PRESENT' ? 'text-green-600' :
                                record.status === 'LATE' ? 'text-yellow-600' :
                                record.status === 'ABSENT' ? 'text-red-600' :
                                record.status === 'HALF_DAY' ? 'text-orange-600' :
                                record.status === 'LEAVE_APPROVED' ? 'text-blue-600' :
                                record.status === 'WFH_APPROVED' ? 'text-purple-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(record.status)} className="text-xs font-medium">
                            {formatStatus(record.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Time Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-800">Check In</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">
                              {record.checkInTime || '--:--'}
                            </p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-medium text-red-800">Check Out</span>
                            </div>
                            <p className="text-lg font-bold text-red-900">
                              {record.checkOutTime || '--:--'}
                            </p>
                          </div>
                        </div>

                        {/* Hours Worked */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Timer className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Hours Worked</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-900">
                              {record.hoursWorked?.toFixed(1) || '0.0'}h
                            </span>
                          </div>
                          <div className="w-full bg-blue-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((record.hoursWorked || 0) / 8 * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Lunch Break */}
                        {(record.lunchOutTime || record.lunchInTime) && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Coffee className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Lunch Break</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
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

                        {/* Remarks */}
                        {record.remarks && (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-gray-600 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Note</span>
                                <p className="text-sm text-gray-600 mt-1">{record.remarks}</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}