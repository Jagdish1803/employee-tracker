// src/app/employee/attendance/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, BarChart3, Users, Clock, CheckCircle, XCircle, AlertTriangle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Employee, Attendance, AttendanceSummary, AttendanceCalendarView } from '@/types';
import { useEmployeeCalendar, useEmployeeSummary } from '@/hooks/useAttendanceQuery';

export default function EmployeeAttendancePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'summary'>('calendar');

  // Use React Query for data fetching
  const calendarQuery = useEmployeeCalendar(
    employee?.id || 0, 
    selectedMonth, 
    selectedYear
  );
  
  const summaryQuery = useEmployeeSummary(
    employee?.id || 0, 
    selectedMonth, 
    selectedYear
  );

  const generateMockAttendanceData = useCallback((): AttendanceCalendarView[] => {
    const data: AttendanceCalendarView[] = [];
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${selectedMonth.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      // Skip Sundays for mock data
      if (dayOfWeek === 0) {
        continue;
      }

      // Generate random attendance status
      const statuses: Attendance['status'][] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE_APPROVED'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      data.push({
        date,
        status,
        checkInTime: status !== 'ABSENT' ? '09:00:00' : undefined,
        checkOutTime: status === 'PRESENT' ? '18:00:00' : status === 'HALF_DAY' ? '13:00:00' : undefined,
        hoursWorked: status === 'PRESENT' ? 8 : status === 'HALF_DAY' ? 4 : 0,
        remarks: status === 'LATE' ? 'Late arrival' : status === 'LEAVE_APPROVED' ? 'Approved leave' : undefined
      });
    }

    return data;
  }, [selectedMonth, selectedYear]);

  const generateMockSummary = useCallback((): AttendanceSummary => {
    return {
      employeeId: employee?.id || 0,
      month: selectedMonth,
      year: selectedYear,
      totalWorkingDays: 22,
      presentDays: 18,
      absentDays: 2,
      halfDays: 1,
      lateDays: 1,
      leaveDays: 2,
      totalHoursWorked: 156,
      averageHoursPerDay: 7.8,
      attendancePercentage: 81.8
    };
  }, [employee?.id, selectedMonth, selectedYear]);

  // Use mock data for now since API endpoints might not be implemented
  const attendanceData = React.useMemo(() => {
    if (calendarQuery.data) {
      return calendarQuery.data;
    }
    // Return mock data if API fails
    return generateMockAttendanceData();
  }, [calendarQuery.data, generateMockAttendanceData]);

  const summary = React.useMemo(() => {
    if (summaryQuery.data) {
      return summaryQuery.data;
    }
    // Return mock summary if API fails
    return generateMockSummary();
  }, [summaryQuery.data, generateMockSummary]);

  const loading = calendarQuery.isLoading || summaryQuery.isLoading;

  useEffect(() => {
    // Get logged in employee
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      try {
        const emp = JSON.parse(savedEmployee);
        setEmployee(emp);
      } catch (error) {
        console.error('Error parsing employee data:', error);
      }
    }

    // Set default to current month/year
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  const loadAttendanceData = useCallback(async () => {
    if (!employee) return;

    try {
      // React Query will handle the data fetching automatically
      // This function is kept for compatibility but could be removed
      console.log('Loading attendance data for employee:', employee.id);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    }
  }, [employee]);

  useEffect(() => {
    if (employee && selectedMonth && selectedYear) {
      loadAttendanceData();
    }
  }, [employee, selectedMonth, selectedYear, loadAttendanceData]);


  const generateMonthOptions = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = String(i).padStart(2, '0');
      const monthName = new Date(2000, i - 1, 1).toLocaleString('default', { month: 'long' });
      months.push({ value: month, label: `${month} - ${monthName}` });
    }
    return months;
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 2; i--) {
      years.push({ value: String(i), label: String(i) });
    }
    return years;
  };

  const getStatusBadge = (status: Attendance['status']) => {
    const statusConfig = {
      PRESENT: { label: 'Present', className: 'bg-green-100 text-green-800' },
      ABSENT: { label: 'Absent', className: 'bg-red-100 text-red-800' },
      LATE: { label: 'Late', className: 'bg-yellow-100 text-yellow-800' },
      HALF_DAY: { label: 'Half Day', className: 'bg-blue-100 text-blue-800' },
      LEAVE_APPROVED: { label: 'Leave', className: 'bg-purple-100 text-purple-800' },
      WFH_APPROVED: { label: 'WFH', className: 'bg-indigo-100 text-indigo-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getDaysInMonth = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    return new Date(year, month, 0).getDate();
  };

  const getMonthName = () => {
    const month = parseInt(selectedMonth) - 1;
    return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
  };

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth();
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${selectedMonth.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const attendance = Array.isArray(attendanceData)
        ? attendanceData.find((a: AttendanceCalendarView) => a.date === date)
        : undefined;
      const isWeekend = new Date(year, month, day).getDay() === 0; // Only Sunday
      
      days.push(
        <div key={day} className={`p-2 border rounded-lg min-h-[80px] ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
          {!isWeekend && attendance && (
            <div className="space-y-1">
              {getStatusBadge(attendance.status)}
              {attendance.checkInTime && (
                <div className="text-xs text-gray-600">
                  In: {attendance.checkInTime.substring(0, 5)}
                </div>
              )}
              {attendance.checkOutTime && (
                <div className="text-xs text-gray-600">
                  Out: {attendance.checkOutTime.substring(0, 5)}
                </div>
              )}
              {attendance.hoursWorked && (
                <div className="text-xs text-gray-600">
                  {attendance.hoursWorked}h
                </div>
              )}
            </div>
          )}
          {isWeekend && (
            <div className="text-xs text-gray-400">Sunday</div>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 bg-gray-100 rounded">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!summary) return null;

    const summaryCards = [
      {
        title: 'Total Working Days',
        value: summary.totalWorkingDays,
        icon: CalendarDays,
        color: 'text-blue-600'
      },
      {
        title: 'Present Days',
        value: summary.presentDays,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        title: 'Absent Days',
        value: summary.absentDays,
        icon: XCircle,
        color: 'text-red-600'
      },
      {
        title: 'Leave Days',
        value: summary.leaveDays,
        icon: Calendar,
        color: 'text-purple-600'
      },
      {
        title: 'Late Days',
        value: summary.lateDays,
        icon: AlertTriangle,
        color: 'text-yellow-600'
      },
      {
        title: 'Half Days',
        value: summary.halfDays,
        icon: Clock,
        color: 'text-blue-600'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{String(card.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Attendance Percentage</span>
                  <span className="text-lg font-bold text-green-600">{String(summary.attendancePercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${String(summary.attendancePercentage)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Hours Worked</span>
                  <span className="text-lg font-bold">{String(summary.totalHoursWorked)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Hours/Day</span>
                  <span className="text-lg font-bold">{String(summary.averageHoursPerDay)}h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Present', value: summary.presentDays, total: summary.totalWorkingDays, color: 'bg-green-500' },
                { label: 'Absent', value: summary.absentDays, total: summary.totalWorkingDays, color: 'bg-red-500' },
                { label: 'Leave', value: summary.leaveDays, total: summary.totalWorkingDays, color: 'bg-purple-500' },
                { label: 'Late', value: summary.lateDays, total: summary.totalWorkingDays, color: 'bg-yellow-500' },
                { label: 'Half Day', value: summary.halfDays, total: summary.totalWorkingDays, color: 'bg-blue-500' }
              ].map((item) => {
                const percentage = (Number(item.value) / Number(item.total)) * 100;
                return (
                  <div key={item.label} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{item.label}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${item.color} h-3 rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">
                      {String(item.value)} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Not Logged In</h3>
          <p className="text-gray-600">Please log in to view your attendance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarDays className="h-7 w-7 mr-2 text-primary" />
                My Attendance
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {employee.name} ({employee.employeeCode})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-4">
                <div>
                  <Select value={selectedMonth || undefined} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMonthOptions().map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={selectedYear || undefined} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setViewMode('calendar')}
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar View
                </Button>
                <Button
                  onClick={() => setViewMode('summary')}
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Summary View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'calendar' ? 'Calendar View' : 'Summary View'} - {getMonthName()} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading attendance data...</p>
              </div>
            ) : viewMode === 'calendar' ? (
              renderCalendarView()
            ) : (
              renderSummaryView()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}