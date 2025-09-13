// src/app/api/logs/by-date/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, connectDB, ensureConnection } from '@/lib/prisma';
import { employeeQuerySchema } from '@/lib/validations';

// GET /api/logs/by-date - Get logs by specific date and employee
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureConnection();
    
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    console.log('Incoming query:', query);
    let validatedQuery;
    try {
      validatedQuery = employeeQuerySchema.parse(query);
    } catch (zodError) {
      console.error('Validation failed:', zodError);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: zodError,
        },
        { status: 400 }
      );
    }

    if (!validatedQuery.employeeId || !validatedQuery.logDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID and log date are required',
        },
        { status: 400 }
      );
    }

    const employeeId = Number(validatedQuery.employeeId);
    const logDate = new Date(validatedQuery.logDate);
    if (isNaN(employeeId) || isNaN(logDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employeeId or logDate',
        },
        { status: 400 }
      );
    }

    let logs = [];
    try {
      logs = await prisma.log.findMany({
        where: {
          employeeId,
          logDate,
        },
        include: {
          employee: true,
          tag: true,
        },
        orderBy: {
          tag: { tagName: 'asc' },
        },
      });
      console.log('Fetched logs:', logs);
    } catch (logError) {
      console.error('Error fetching logs:', logError);
      throw logError;
    }

    let submissionStatus = null;
    try {
      submissionStatus = await prisma.submissionStatus.findUnique({
        where: {
          employee_date: {
            employeeId,
            submissionDate: logDate,
          },
        },
      });
      console.log('Fetched submissionStatus:', submissionStatus);
    } catch (statusError) {
      console.error('Error fetching submissionStatus:', statusError);
      // Do not throw, just leave submissionStatus as null
    }

    return NextResponse.json({
      success: true,
      data: logs,
      submissionStatus, // Always include submissionStatus in the response
    });
  } catch (error) {
    console.error('Error fetching logs by date:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}