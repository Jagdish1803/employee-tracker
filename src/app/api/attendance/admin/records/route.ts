// src/app/api/attendance/admin/records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    console.log('Fetching attendance records with params:', { month, year, status });

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
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
    });

    console.log(`Found ${records.length} attendance records`);

    // Transform records for frontend
    const transformedRecords = records.map(record => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee?.name || 'Unknown',
      employeeCode: record.employee?.employeeCode || 'N/A',
      department: record.employee?.department || 'General',
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      checkInTime: record.checkInTime ?
        record.checkInTime.toTimeString().slice(0, 5) : null,
      checkOutTime: record.checkOutTime ?
        record.checkOutTime.toTimeString().slice(0, 5) : null,
      lunchOutTime: record.lunchOutTime ?
        record.lunchOutTime.toTimeString().slice(0, 5) : null,
      lunchInTime: record.lunchInTime ?
        record.lunchInTime.toTimeString().slice(0, 5) : null,
      breakOutTime: record.breakOutTime ?
        record.breakOutTime.toTimeString().slice(0, 5) : null,
      breakInTime: record.breakInTime ?
        record.breakInTime.toTimeString().slice(0, 5) : null,
      hoursWorked: record.totalHours,
      remarks: record.exceptionNotes,
      source: record.importSource,
      uploadedAt: record.createdAt.toISOString(),
      shift: record.shift,
      shiftStart: record.shiftStart,
      employee: record.employee
    }));

    return NextResponse.json(transformedRecords);

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}
