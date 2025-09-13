import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build the table name based on month and year
    const tableName = `attendance_${month}_srp`;

    // Check if the table exists
    const tableExistsResult = await prisma.$queryRawUnsafe<{ exists: string | null }[]>(
      `SELECT to_regclass($1)::text as exists`, tableName
    );
    if (!tableExistsResult || !tableExistsResult[0] || !tableExistsResult[0].exists) {
      return NextResponse.json({
        success: false,
        error: `Table ${tableName} does not exist`,
        message: `No attendance data found for month ${month} and year ${year}`
      }, { status: 404 });
    }

    // Build the raw SQL query
    const whereConditions = [];
    const queryParams: unknown[] = [];

    // Add status filter
    if (status && status !== 'ALL') {
      whereConditions.push(`status = ?`);
      queryParams.push(status);
    }

    // Add search filter (employee name or code)
    if (search && search.trim()) {
      whereConditions.push(`(employeeName LIKE ? OR employeeCode LIKE ?)`);
      queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Execute raw SQL query
    const query = `
      SELECT 
        id,
        employeeName,
        employeeCode,
        department,
        date,
        status,
        checkInTime,
        checkOutTime,
        lunchOutTime,
        lunchInTime,
        hoursWorked,
        remarks,
        source,
        uploadedAt,
        shift,
        shiftStart
      FROM ${tableName}
      ${whereClause}
      ORDER BY date DESC, employeeName ASC
    `;

    const records = await prisma.$queryRawUnsafe(query, ...queryParams) as Record<string, unknown>[];

    // Transform the data to match the expected format
    const transformedRecords = records.map(record => ({
      ...record,
      employeeId: record.id, // Map for compatibility
      // Ensure null values are handled correctly
      checkInTime: record.checkInTime || null,
      checkOutTime: record.checkOutTime || null,
      lunchOutTime: record.lunchOutTime || null,
      lunchInTime: record.lunchInTime || null,
      remarks: record.remarks || null,
      shift: record.shift || null,
      shiftStart: record.shiftStart || null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedRecords,
      total: transformedRecords.length,
      month,
      year,
      table: tableName
    });

  } catch (error: unknown) {
    // Log the full error for debugging
    console.error('[Optimized API] Error:', error);
    // Return error response that the fallback can handle
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: 'Failed to fetch attendance records from optimized endpoint'
    }, { status: 500 });
  }
}