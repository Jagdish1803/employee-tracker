// src/components/employee/AttendanceCalendar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { attendanceService } from '@/api';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE_APPROVED' | 'WFH_APPROVED' | 'LATE' | 'HALF_DAY';
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  hasException: boolean;
  exceptionType?: string;
  hasTagWork: boolean;
  hasFlowaceWork: boolean;
  tagWorkMinutes: number;
  flowaceMinutes: number;
}

interface AttendanceCalendarProps {
  employeeId: number;
}

const statusColors = {
  PRESENT: 'bg-green-100 text-green-800 border-green-300',
  ABSENT: 'bg-red-100 text-red-800 border-red-300',
  LEAVE_APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
  WFH_APPROVED: 'bg-purple-100 text-purple-800 border-purple-300',
  LATE: 'bg-orange-100 text-orange-800 border-orange-300',
  HALF_DAY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const statusLabels = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LEAVE_APPROVED: 'Leave',
  WFH_APPROVED: 'WFH',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
};

export function AttendanceCalendar({ employeeId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);

        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear().toString();

        const response = await attendanceService.getByEmployee(employeeId, { month, year });

        if (Array.isArray(response)) {
          const records = (response as unknown as (AttendanceRecord & Record<string, unknown>)[]).map((record) => ({
            ...record,
            hasException: record.hasException || false,
            hasTagWork: record.hasTagWork || false,
            hasFlowaceWork: record.hasFlowaceWork || false,
            tagWorkMinutes: record.tagWorkMinutes || 0,
            flowaceMinutes: record.flowaceMinutes || 0,
          }));
          setAttendanceData(records);
        } else {
          setAttendanceData([]);
          toast.error('Failed to load attendance data');
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
        setAttendanceData([]);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [employeeId, currentDate]);

  const getAttendanceForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return attendanceData.find(record => 
      record.date.split('T')[0] === dateString
    );
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth();
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });


  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Attendance Calendar</h3>
          {loading && (
            <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {monthYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2 h-20"></div>;
          }

          const attendance = getAttendanceForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isWeekend = day.getDay() === 0; // Only Sunday

          return (
            <div
              key={index}
              className={`p-2 h-20 border rounded-lg relative ${
                isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
              } ${isWeekend ? 'bg-gray-50' : ''}`}
            >
              <div className="text-sm font-medium mb-1">
                {day.getDate()}
              </div>
              
              {attendance && (
                <div className="absolute inset-x-1 bottom-1">
                  <Badge
                    variant="outline"
                    className={`text-xs px-1 py-0 w-full justify-center ${
                      statusColors[attendance.status]
                    }`}
                  >
                    {statusLabels[attendance.status]}
                  </Badge>
                  
                  {attendance.hasException && (
                    <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-sm font-medium mb-3">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(statusColors).map(([status, colorClass]) => (
            <div key={status} className="flex items-center gap-2">
              <Badge variant="outline" className={`${colorClass} text-xs`}>
                {statusLabels[status as keyof typeof statusLabels]}
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-xs text-gray-600">Exception</span>
        </div>
      </div>
    </div>
  );
}