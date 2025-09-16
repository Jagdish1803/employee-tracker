// src/app/api/attendance/employee/[employeeId]/calendar/route.ts
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
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching calendar for employee ${employeeId}, ${month}/${year}`);

    // Build date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        attendanceDate: 'asc'
      }
    });

    console.log(`Found ${attendanceRecords.length} attendance records`);

    // Transform to calendar view format
    const calendarData = attendanceRecords.map(record => ({
      date: record.attendanceDate.toISOString().split('T')[0],
      status: record.status,
      checkInTime: record.checkInTime ? 
        record.checkInTime.toTimeString().slice(0, 8) : undefined,
      checkOutTime: record.checkOutTime ? 
        record.checkOutTime.toTimeString().slice(0, 8) : undefined,
      lunchOutTime: record.lunchOutTime ? 
        record.lunchOutTime.toTimeString().slice(0, 8) : undefined,
      lunchInTime: record.lunchInTime ? 
        record.lunchInTime.toTimeString().slice(0, 8) : undefined,
      hoursWorked: record.hoursWorked,
      remarks: record.remarks
    }));

    return NextResponse.json(calendarData);

  } catch (error) {
    console.error('Error fetching employee calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee calendar' },
      { status: 500 }
    );
  }
}
