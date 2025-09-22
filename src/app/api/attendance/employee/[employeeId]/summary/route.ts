// src/app/api/attendance/employee/[employeeId]/summary/route.ts
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

    console.log(`Fetching summary for employee ${employeeId}, ${month}/${year}`);

    // Build date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    console.log(`Found ${attendanceRecords.length} attendance records for summary`);

    // Calculate working days (excluding weekends)
    const totalWorkingDays = calculateWorkingDays(startDate, endDate);
    
    // Calculate summary statistics
    const presentDays = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const halfDays = attendanceRecords.filter(r => r.status === 'HALF_DAY').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'LATE').length;
    const leaveDays = attendanceRecords.filter(r => 
      r.status === 'LEAVE_APPROVED' || r.status === 'WFH_APPROVED'
    ).length;

    const totalHoursWorked = attendanceRecords.reduce((total, record) =>
      total + (record.totalHours || 0), 0
    );

    const averageHoursPerDay = presentDays > 0 ? totalHoursWorked / presentDays : 0;
    const attendancePercentage = totalWorkingDays > 0 ? 
      ((presentDays + halfDays * 0.5) / totalWorkingDays) * 100 : 0;

    const summary = {
      employeeId,
      month,
      year,
      totalWorkingDays,
      presentDays,
      absentDays,
      halfDays,
      lateDays,
      leaveDays,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching employee summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee summary' },
      { status: 500 }
    );
  }
}

function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Skip Sunday (0) only
    if (dayOfWeek !== 0) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}
