// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const createAttendanceSchema = z.object({
  employeeId: z.number(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE_APPROVED', 'WFH_APPROVED', 'LATE', 'HALF_DAY']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  totalHours: z.number().optional(),
  tagWorkMinutes: z.number().default(0),
  flowaceMinutes: z.number().default(0),
  hasException: z.boolean().default(false),
  exceptionType: z.enum(['WORKED_ON_APPROVED_LEAVE', 'NO_WORK_ON_WFH', 'ABSENT_DESPITE_DENIAL', 'WORKED_DESPITE_DENIAL', 'ATTENDANCE_WORK_MISMATCH', 'MISSING_CHECKOUT', 'WORK_WITHOUT_CHECKIN']).optional(),
  exceptionNotes: z.string().optional(),
  importSource: z.string().default('manual'),
  importBatch: z.string().optional(),
});

// GET /api/attendance - Get attendance records with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const employeeId = searchParams.get('employeeId');

    console.log('Fetching unified attendance records with params:', { month, year, status, search, employeeId });

    // Build where clause for date filtering with proper date handling
    let dateFilter: Record<string, unknown> = {};
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Validate month and year
      if (monthNum >= 1 && monthNum <= 12 && yearNum > 1900 && yearNum < 3000) {
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        dateFilter = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    // Build employee filter
    const employeeFilter = employeeId ? { employeeId: parseInt(employeeId) } : {};

    // Query AttendanceRecord table only
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        ...employeeFilter,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        ...(status && status !== 'ALL' && { status: status as AttendanceStatus }),
        // Add search filter at database level for better performance
        ...(search && search.trim() && {
          employee: {
            OR: [
              { name: { contains: search.trim(), mode: 'insensitive' } },
              { employeeCode: { contains: search.trim(), mode: 'insensitive' } },
              { department: { contains: search.trim(), mode: 'insensitive' } }
            ]
          }
        })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { employee: { name: 'asc' } }
      ]
    }).catch(error => {
      console.error('Error querying AttendanceRecord table:', error);
      return [];
    });

    console.log(`Found ${attendanceRecords.length} records from AttendanceRecord table`);

    // Helper function for safe time formatting (timezone-agnostic)
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

    // Helper function for safe date formatting
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      try {
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };

    // Transform AttendanceRecord to response format
    const transformedRecords = attendanceRecords.map(record => {
      try {
        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeName: record.employee?.name || 'Unknown',
          employeeCode: record.employee?.employeeCode || 'N/A',
          department: record.employee?.department || 'General',
          date: formatDate(record.date),
          status: record.status,
          checkInTime: formatTime(record.checkInTime),
          checkOutTime: formatTime(record.checkOutTime),
          lunchOutTime: formatTime(record.lunchOutTime),
          lunchInTime: formatTime(record.lunchInTime),
          breakOutTime: formatTime(record.breakOutTime),
          breakInTime: formatTime(record.breakInTime),
          hoursWorked: record.totalHours || 0,
          remarks: record.exceptionNotes || '',
          source: record.importSource || 'csv',
          uploadedAt: record.createdAt.toISOString(),
          shift: record.shift || null,
          shiftStart: record.shiftStart || null,
          employee: record.employee
        };
      } catch (error) {
        console.error('Error transforming AttendanceRecord:', error, record);
        return null;
      }
    }).filter(Boolean);

    // Sort by date (newest first) and then by employee name
    transformedRecords.sort((a, b) => {
      try {
        if (!a || !b) return 0;
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return (a.employeeName || '').localeCompare(b.employeeName || '');
      } catch (error) {
        console.error('Error sorting records:', error);
        return 0;
      }
    });

    console.log(`Returning ${transformedRecords.length} total records after processing`);

    return NextResponse.json({
      success: true,
      data: transformedRecords,
      meta: {
        totalRecords: transformedRecords.length,
        filters: { month, year, status, search, employeeId }
      }
    });

  } catch (error) {
    console.error('Error fetching unified attendance records:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance records',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating attendance record with data:', body);

    const validatedData = createAttendanceSchema.parse(body);

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
          message: `No employee found with ID: ${validatedData.employeeId}`
        },
        { status: 404 }
      );
    }

    // Validate and parse date
    const attendanceDate = new Date(validatedData.date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format',
          message: `Date ${validatedData.date} is not a valid date`
        },
        { status: 400 }
      );
    }

    // Parse and validate times
    const parseTimeWithDate = (timeStr: string | undefined, date: Date): Date | null => {
      if (!timeStr) return null;

      try {
        // Handle both full datetime and time-only strings
        if (timeStr.includes('T') || timeStr.includes(' ')) {
          return new Date(timeStr);
        } else {
          // Time only format (HH:MM) - treat as IST
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new Error(`Invalid time format: ${timeStr}`);
          }
          
          // Create date in IST timezone
          const dateStr = date.toISOString().split('T')[0];
          const istTimeStr = `${dateStr}T${timeStr}:00`;
          
          // Parse as IST and convert to UTC for database storage
          const istDate = new Date(istTimeStr);
          // Subtract IST offset (5.5 hours) to get UTC
          const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
          
          return utcDate;
        }
      } catch (error) {
        console.error(`Error parsing time ${timeStr}:`, error);
        return null;
      }
    };

    const checkInTime = parseTimeWithDate(validatedData.checkInTime, attendanceDate);
    const checkOutTime = parseTimeWithDate(validatedData.checkOutTime, attendanceDate);

    // Calculate work evidence flags
    const hasTagWork = validatedData.tagWorkMinutes > 0;
    const hasFlowaceWork = validatedData.flowaceMinutes > 0;

    // Calculate total hours if not provided but times are available
    let totalHours = validatedData.totalHours;
    if (!totalHours && checkInTime && checkOutTime) {
      const timeDiff = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = Math.round((timeDiff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    }

    // Validate status logic
    const finalStatus = validatedData.status;
    if (finalStatus === 'PRESENT' && !checkInTime && !totalHours && !hasTagWork && !hasFlowaceWork) {
      console.warn(`Employee ${employee.name} marked present but no evidence of work found`);
    }

    const attendanceRecord = await prisma.attendanceRecord.upsert({
      where: {
        employee_date_attendance: {
          employeeId: validatedData.employeeId,
          date: attendanceDate,
        },
      },
      update: {
        status: finalStatus,
        checkInTime,
        checkOutTime,
        totalHours,
        hasTagWork,
        hasFlowaceWork,
        tagWorkMinutes: validatedData.tagWorkMinutes || 0,
        flowaceMinutes: validatedData.flowaceMinutes || 0,
        hasException: validatedData.hasException || false,
        exceptionType: validatedData.exceptionType || null,
        exceptionNotes: validatedData.exceptionNotes || null,
        importSource: validatedData.importSource || 'manual',
        importBatch: validatedData.importBatch || null,
        updatedAt: new Date()
      },
      create: {
        employeeId: validatedData.employeeId,
        date: attendanceDate,
        status: finalStatus,
        checkInTime,
        checkOutTime,
        totalHours,
        hasTagWork,
        hasFlowaceWork,
        tagWorkMinutes: validatedData.tagWorkMinutes || 0,
        flowaceMinutes: validatedData.flowaceMinutes || 0,
        hasException: validatedData.hasException || false,
        exceptionType: validatedData.exceptionType || null,
        exceptionNotes: validatedData.exceptionNotes || null,
        importSource: validatedData.importSource || 'manual',
        importBatch: validatedData.importBatch || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true
          }
        },
      },
    });

    console.log('Successfully created/updated attendance record:', attendanceRecord.id);

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance record created/updated successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/attendance:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'The provided data does not meet the required format',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create attendance record',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}