'use client'

import React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
  id: number
  employeeId: number
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE_APPROVED' | 'WFH_APPROVED'
  checkInTime?: string
  checkOutTime?: string
  lunchOutTime?: string
  lunchInTime?: string
  hoursWorked?: number
  remarks?: string
}

interface AttendanceCalendarProps {
  selectedDate?: Date
  onSelect?: (date: Date | undefined) => void
  currentMonth: Date
  onMonthChange: (month: Date) => void
  attendanceRecords: AttendanceRecord[]
  loading?: boolean
}

export function AttendanceCalendar({
  selectedDate,
  onSelect,
  currentMonth,
  onMonthChange,
  attendanceRecords,
  loading = false
}: AttendanceCalendarProps) {
  // Create a map of dates to attendance status
  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendanceRecords.find(record => record.date === dateStr)
  }

  // Custom day cell renderer
  const renderDay = (date: Date) => {
    const attendance = getAttendanceForDate(date)
    const dayOfMonth = format(date, 'd')

    if (!attendance) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="text-sm">{dayOfMonth}</span>
        </div>
      )
    }

    const getStatusColor = (status: AttendanceRecord['status']) => {
      switch (status) {
        case 'PRESENT':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'LATE':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'ABSENT':
          return 'bg-red-100 text-red-800 border-red-200'
        case 'HALF_DAY':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'LEAVE_APPROVED':
          return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'WFH_APPROVED':
          return 'bg-orange-100 text-orange-800 border-orange-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    return (
      <div className={cn(
        "relative w-full h-full flex items-center justify-center rounded-sm border",
        getStatusColor(attendance.status)
      )}>
        <span className="text-sm font-medium">{dayOfMonth}</span>
        <div className="absolute bottom-0 right-0 w-1 h-1 rounded-full bg-current opacity-75"></div>
      </div>
    )
  }

  const getSelectedAttendance = () => {
    if (!selectedDate) return null
    return getAttendanceForDate(selectedDate)
  }

  const selectedAttendance = getSelectedAttendance()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on a date to view attendance details
          </p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelect}
            month={currentMonth}
            onMonthChange={onMonthChange}
            className="rounded-md border"
            components={{
              Day: ({ day }) => renderDay(day.date)
            }}
            disabled={loading}
          />

          {/* Legend */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Legend:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span>Half Day</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span>Leave</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span>Work From Home</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={selectedAttendance.status === 'PRESENT' ? 'default' :
                                 selectedAttendance.status === 'LATE' ? 'secondary' :
                                 selectedAttendance.status === 'ABSENT' ? 'destructive' : 'outline'}>
                    {selectedAttendance.status.replace('_', ' ')}
                  </Badge>
                </div>

                {selectedAttendance.checkInTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Check In:</span>
                    <span className="text-sm">{selectedAttendance.checkInTime}</span>
                  </div>
                )}

                {selectedAttendance.checkOutTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Check Out:</span>
                    <span className="text-sm">{selectedAttendance.checkOutTime}</span>
                  </div>
                )}

                {selectedAttendance.lunchOutTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lunch Out:</span>
                    <span className="text-sm">{selectedAttendance.lunchOutTime}</span>
                  </div>
                )}

                {selectedAttendance.lunchInTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lunch In:</span>
                    <span className="text-sm">{selectedAttendance.lunchInTime}</span>
                  </div>
                )}

                {selectedAttendance.hoursWorked && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hours Worked:</span>
                    <span className="text-sm">{selectedAttendance.hoursWorked}h</span>
                  </div>
                )}

                {selectedAttendance.remarks && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Remarks:</span>
                    <p className="text-sm text-muted-foreground">{selectedAttendance.remarks}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No attendance record for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}