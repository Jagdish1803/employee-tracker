'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { attendanceService } from '@/api';
import { toast } from 'react-hot-toast';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = employee?.id || 1;

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);

      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      // Fetch real attendance data from API
      const [attendanceResponse, summaryResponse] = await Promise.all([
        attendanceService.getByEmployee(employeeId, {
          month: month.toString(),
          year: year.toString()
        }),
        attendanceService.getEmployeeSummary(employeeId, month.toString(), year.toString())
      ]);

      console.log('Attendance response:', attendanceResponse);
      console.log('Summary response:', summaryResponse);

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
          totalWorkingDays: 22, // Default working days in a month
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
  }, [currentMonth, employeeId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'LATE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HALF_DAY':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      case 'WFH_APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'default';
      case 'LATE':
        return 'secondary';
      case 'ABSENT':
        return 'destructive';
      case 'HALF_DAY':
        return 'outline';
      case 'LEAVE_APPROVED':
      case 'WFH_APPROVED':
        return 'secondary';
      default:
        return 'outline';
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


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance and work hours</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.attendancePercentage}%</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.presentDays}</div>
              <p className="text-xs text-muted-foreground">
                Out of {summary.totalWorkingDays} working days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHoursWorked}h</div>
              <p className="text-xs text-muted-foreground">
                Avg {summary.averageHoursPerDay}h per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Days</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.lateDays}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enhanced Calendar View */}
        <AttendanceCalendar
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          attendanceRecords={attendanceRecords}
          loading={loading}
        />

        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading records...</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {record.checkInTime && (
                            <span>In: {record.checkInTime}</span>
                          )}
                          {record.checkOutTime && (
                            <span>Out: {record.checkOutTime}</span>
                          )}
                          {record.hoursWorked && (
                            <span>({record.hoursWorked}h)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {formatStatus(record.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}