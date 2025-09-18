import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, AssetType, AssignmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/assets/history - Get assignment history with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const employeeId = searchParams.get('employeeId');
    const employeeName = searchParams.get('employeeName');
    const employeeCode = searchParams.get('employeeCode');
    const assetName = searchParams.get('assetName');
    const assetType = searchParams.get('assetType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where conditions
    const where: Prisma.AssetAssignmentWhereInput = {};

    // Filter by asset
    if (assetId) {
      where.assetId = parseInt(assetId);
    }

    // Filter by employee
    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }

    // Filter by employee name or code
    if (employeeName || employeeCode) {
      where.employee = {};
      if (employeeName) {
        where.employee.name = { contains: employeeName, mode: Prisma.QueryMode.insensitive };
      }
      if (employeeCode) {
        where.employee.employeeCode = { contains: employeeCode, mode: Prisma.QueryMode.insensitive };
      }
    }

    // Filter by asset name or type
    if (assetName || assetType) {
      where.asset = {};
      if (assetName) {
        where.asset.assetName = { contains: assetName, mode: Prisma.QueryMode.insensitive };
      }
      if (assetType && assetType !== 'all') {
        where.asset.assetType = assetType as AssetType;
      }
    }

    // Filter by assignment status
    if (status && status !== 'all') {
      where.status = status as AssignmentStatus;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.assignedDate = dateFilter;
    }

    // Execute count and data queries in parallel for better performance
    const [total, assignments] = await Promise.all([
      prisma.assetAssignment.count({ where }),
      prisma.assetAssignment.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetName: true,
            assetTag: true,
            assetType: true,
            serialNumber: true,
            model: true,
            brand: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true
          }
        }
      },
        orderBy: { assignedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    // Add calculated fields
    const enrichedAssignments = assignments.map(assignment => ({
      ...assignment,
      duration: assignment.returnDate
        ? Math.ceil((assignment.returnDate.getTime() - assignment.assignedDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date().getTime() - assignment.assignedDate.getTime()) / (1000 * 60 * 60 * 24)),
      isActive: assignment.status === 'ACTIVE'
    }));

    return NextResponse.json({
      success: true,
      data: enrichedAssignments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error: unknown) {
    console.error('Asset History API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}