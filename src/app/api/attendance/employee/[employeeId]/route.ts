// src/app/api/attendance/employee/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId: employeeIdParam } = await params;
    const employeeId = parseInt(employeeIdParam);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!employeeId || isNaN(employeeId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employee ID',
          data: []
        },
        { status: 400 }
      );
    }

    console.log(`Fetching attendance for employee ${employeeId} with filters:`, { month, year });

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, employeeCode: true, department: true }
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
          data: []
        },
        { status: 404 }
      );
    }

    // Build date filter with proper validation
    let dateFilter: Record<string, unknown> = {};
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (monthNum >= 1 && monthNum <= 12 && yearNum > 1900 && yearNum < 3000) {
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        dateFilter = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    // Query both tables for comprehensive data
    const [attendanceRecords, attendanceData] = await Promise.all([
      // Query AttendanceRecord table
      prisma.attendanceRecord.findMany({
        where: {
          employeeId: employeeId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              department: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }).catch(error => {
        console.error('Error querying AttendanceRecord for employee:', error);
        return [];
      }),

      // Query Attendance table
      prisma.attendance.findMany({
        where: {
          employeeId: employeeId,
          ...(Object.keys(dateFilter).length > 0 && { attendanceDate: dateFilter }),
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              department: true
            }
          }
        },
        orderBy: {
          attendanceDate: 'desc'
        }
      }).catch(error => {
        console.error('Error querying Attendance for employee:', error);
        return [];
      })
    ]);

    console.log(`Found ${attendanceRecords.length} records from AttendanceRecord table`);
    console.log(`Found ${attendanceData.length} records from Attendance table`);

    // Helper functions for safe formatting (timezone-agnostic)
    const formatTime = (dateTime: Date | null | undefined): string | null => {
      if (!dateTime) return null;
      try {
        // Ensure we're working with a Date object
        const date = new Date(dateTime);
        
        // Format as HH:MM using UTC to avoid timezone issues
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
      } catch (error) {
        console.error('Error formatting time:', error);
        return null;
      }
    };

    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      try {
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };

    // Transform both data sources to common format
    const transformedAttendanceRecords = attendanceRecords.map(record => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee?.name || employee.name,
      employeeCode: record.employee?.employeeCode || employee.employeeCode,
      department: record.employee?.department || employee.department,
      date: formatDate(record.date),
      status: record.status,
      checkInTime: formatTime(record.checkInTime),
      checkOutTime: formatTime(record.checkOutTime),
      lunchOutTime: null,
      lunchInTime: null,
      hoursWorked: record.totalHours || 0,
      remarks: record.exceptionNotes || '',
      source: record.importSource || 'csv',
      uploadedAt: record.createdAt.toISOString(),
      shift: null,
      shiftStart: null,
      tableSource: 'AttendanceRecord'
    }));

    const transformedAttendance = attendanceData.map(record => ({
      id: `att_${record.id}`,
      employeeId: record.employeeId,
      employeeName: record.employee?.name || employee.name,
      employeeCode: record.employee?.employeeCode || employee.employeeCode,
      department: record.employee?.department || employee.department,
      date: formatDate(record.attendanceDate),
      status: record.status,
      checkInTime: formatTime(record.checkInTime),
      checkOutTime: formatTime(record.checkOutTime),
      lunchOutTime: formatTime(record.lunchOutTime),
      lunchInTime: formatTime(record.lunchInTime),
      hoursWorked: record.hoursWorked || 0,
      remarks: record.remarks || '',
      source: record.source || 'srp',
      uploadedAt: record.createdAt.toISOString(),
      shift: record.shift || '',
      shiftStart: record.shiftStart || '',
      tableSource: 'Attendance'
    }));

    // Combine and deduplicate (prioritize AttendanceRecord over Attendance)
    const recordMap = new Map();
    const allRecords = [...transformedAttendanceRecords, ...transformedAttendance];

    allRecords.forEach(record => {
      const key = `${record.employeeId}-${record.date}`;
      const existing = recordMap.get(key);

      if (!existing || (existing.tableSource === 'Attendance' && record.tableSource === 'AttendanceRecord')) {
        recordMap.set(key, record);
      }
    });

    const uniqueRecords = Array.from(recordMap.values());

    // Sort by date (newest first)
    uniqueRecords.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        console.error('Error sorting records:', error);
        return 0;
      }
    });

    console.log(`Returning ${uniqueRecords.length} unique attendance records for employee ${employee.name}`);

    return NextResponse.json({
      success: true,
      data: uniqueRecords,
      meta: {
        employee: employee,
        totalRecords: uniqueRecords.length,
        attendanceRecords: transformedAttendanceRecords.length,
        attendanceTableRecords: transformedAttendance.length,
        filters: { month, year }
      }
    });

  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employee attendance',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      },
      { status: 500 }
    );
  }
}