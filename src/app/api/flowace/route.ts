// src/app/api/flowace/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// GET /api/flowace - Get flowace records with filters
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const employeeId = searchParams.get('employeeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('Fetching flowace records with params:', { month, year, search, employeeId, dateFrom, dateTo });

    // Build where clause for date filtering
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
    } else if (dateFrom && dateTo) {
      dateFilter = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    }

    // Build employee filter
    const employeeFilter = employeeId ? { employeeId: parseInt(employeeId) } : {};

    // Get records from database with filters
    console.log('Database query filters:', {
      employeeFilter,
      dateFilter,
      search
    });

    const dbRecords = await prisma.flowaceRecord.findMany({
      where: {
        ...employeeFilter,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        // Add search filter
        ...(search && search.trim() && {
          OR: [
            { employeeName: { contains: search.trim(), mode: 'insensitive' } },
            { employeeCode: { contains: search.trim(), mode: 'insensitive' } },
            { memberEmail: { contains: search.trim(), mode: 'insensitive' } },
            { teams: { contains: search.trim(), mode: 'insensitive' } }
          ]
        })
      },
      orderBy: [
        { date: 'desc' },
        { employeeName: 'asc' }
      ],
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
          }
        }
      }
    });

    console.log(`Found ${dbRecords.length} flowace records in database`);
    if (dbRecords.length > 0) {
      console.log('Sample record:', {
        id: dbRecords[0].id,
        employeeName: dbRecords[0].employeeName,
        date: dbRecords[0].date,
        loggedHours: dbRecords[0].loggedHours,
        productiveHours: dbRecords[0].productiveHours
      });
    }

    // Transform records to match frontend expectations
    const records = dbRecords.map(record => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      employeeCode: record.employeeCode,
      memberEmail: record.memberEmail,
      teams: record.teams,
      date: record.date.toISOString().split('T')[0],
      workStartTime: record.workStartTime,
      workEndTime: record.workEndTime,
      loggedHours: record.loggedHours,
      activeHours: record.activeHours,
      idleHours: record.idleHours,
      classifiedHours: record.classifiedHours,
      unclassifiedHours: record.unclassifiedHours,
      productiveHours: record.productiveHours,
      unproductiveHours: record.unproductiveHours,
      neutralHours: record.neutralHours,
      availableHours: record.availableHours,
      missingHours: record.missingHours,
      activityPercentage: record.activityPercentage,
      classifiedPercentage: record.classifiedPercentage,
      productivityPercentage: record.productivityPercentage,
      classifiedBillableDuration: record.classifiedBillableDuration,
      classifiedNonBillableDuration: record.classifiedNonBillableDuration,
      batchId: record.batchId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      employee: record.employee
    }));

    console.log('Flowace GET: Returning', records.length, 'records');

    return NextResponse.json({
      success: true,
      data: records,
      meta: {
        totalRecords: records.length,
        filters: { month, year, search, employeeId, dateFrom, dateTo }
      },
      message: 'Flowace records retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching flowace records:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flowace records',
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST /api/flowace - Create new flowace record(s)
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();

    const body = await request.json();

    // TODO: Add validation schema for flowace data
    // const validatedData = flowaceCreateSchema.parse(body);

    // TODO: Create flowace record in database
    // const flowaceRecord = await prisma.flowace.create({
    //   data: validatedData,
    // });

    return NextResponse.json({
      success: true,
      data: body, // temporary return of input data
      message: 'Flowace record created successfully',
    });
  } catch (error) {
    console.error('Error creating flowace record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create flowace record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/flowace - Delete flowace record by ID (query parameter)
export async function DELETE(request: NextRequest) {
  try {
    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');

    if (!recordId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Record ID is required',
        },
        { status: 400 }
      );
    }

    // Delete the record from database
    const deletedRecord = await prisma.flowaceRecord.delete({
      where: {
        id: recordId,
      },
    });

    console.log('Flowace DELETE: Deleted record with ID', recordId);

    return NextResponse.json({
      success: true,
      data: deletedRecord,
      message: 'Flowace record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting flowace record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete flowace record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}