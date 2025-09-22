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

    // Build employee filter - if employeeId is provided, also get employee info for name matching
    let employeeFilter = {};
    let employeeInfo = null;

    if (employeeId) {
      const empId = parseInt(employeeId);
      employeeFilter = { employeeId: empId };

      // Get employee info for fallback name matching
      try {
        employeeInfo = await prisma.employee.findUnique({
          where: { id: empId },
          select: { name: true, employeeCode: true }
        });
        console.log('Employee info for ID', empId, ':', employeeInfo);
      } catch (error) {
        console.error('Error fetching employee info:', error);
      }
    }

    console.log('Employee filter will be:', employeeFilter);

    // Get records from database with filters
    let whereClause: Record<string, unknown> = {
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
    };

    // Add employee filter - prioritize name matching over ID
    if (employeeId && employeeInfo) {
      console.log('Matching flowace records for employee:', employeeInfo);

      // Create flexible name matching patterns
      const employeeName = employeeInfo.name;
      const nameVariations = [
        employeeName, // Exact match
        employeeName.toLowerCase().trim(), // Case insensitive
        employeeName.split(' ')[0], // First name only
      ];

      // Special mappings for known name variations from your flowace data
      const nameMapping: Record<string, string[]> = {
        'narayan': ['naryan yadav', 'narayan yadav'],
        'nandini': ['nandini k', 'nandini'],
        'divya': ['divya gatkal', 'divya  gatkal'],
        'prarthana': ['prarthana g', 'prarthana'],
        'yash': ['yash pawar', 'yash kalambe'],
        'neha': ['neha yadav'],
        'kritika': ['kritika soni'],
        'pratik': ['pratik pawar'],
        'radha': ['radha thevar'],
        'karuna': ['karuna mhatre'],
        'shahnawaz': ['shahnawaz zombalkar'],
        'asmita': ['asmita shelar'],
        'magesh': ['magesh konar'],
        'shreedhar': ['shreedhar parab'],
        'kunal': ['kunal karotiya'],
        'hrithik': ['hrithik kadam'],
        'faizan': ['faizan mansuri'],
        'shrusti': ['shrusti lad'],
        'ronit': ['ronit sakpal'],
        'bilal': ['bilal shaikh'],
        'sneha': ['sneha dudhe'],
        'maahi': ['maahi chaugule'],
        'kashish': ['kashish dhakoliya'],
        'madan': ['madan devendra'],
        'aishwarya': ['aishwarya nadar']
      };

      if (nameMapping[employeeName.toLowerCase()]) {
        nameVariations.push(...nameMapping[employeeName.toLowerCase()]);
      }

      console.log('Trying name variations:', nameVariations);

      // Build OR condition for name matching
      whereClause.OR = [
        // Try exact employeeId match first
        { employeeId: parseInt(employeeId) },
        // Then try all name variations
        ...nameVariations.map(name => ({
          employeeName: { equals: name, mode: 'insensitive' }
        })),
        // Also try partial matches
        { employeeName: { contains: employeeName, mode: 'insensitive' } },
        // Try employee code match
        ...(employeeInfo.employeeCode ? [{ employeeCode: employeeInfo.employeeCode }] : [])
      ];
    } else if (employeeId) {
      // Fallback to just ID matching
      whereClause = { ...whereClause, ...employeeFilter };
    }

    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));

    const dbRecords = await prisma.flowaceRecord.findMany({
      where: whereClause,
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

    console.log('Flowace GET: Found', dbRecords.length, 'raw records from database');
    console.log('Flowace GET: Returning', records.length, 'processed records');
    if (employeeId) {
      console.log('Records with matching employeeId:', dbRecords.filter(r => r.employeeId === parseInt(employeeId)).length);
      console.log('Records with null employeeId:', dbRecords.filter(r => r.employeeId === null).length);
    }

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