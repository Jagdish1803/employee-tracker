import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, AssetStatus, AssetType, AssignmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/assets - Get all assets with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const assetType = searchParams.get('assetType') || '';
    const employeeName = searchParams.get('employeeName') || '';
    const employeeCode = searchParams.get('employeeCode') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where conditions
    const where: Prisma.AssetWhereInput = {};

    // Search in asset name, serial number, model, brand
    if (search) {
      where.OR = [
        { assetName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { serialNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { model: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { brand: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status as AssetStatus;
    }

    // Filter by asset type
    if (assetType && assetType !== 'all') {
      where.assetType = assetType as AssetType;
    }

    // Filter by employee name or code through assignments
    if (employeeName || employeeCode) {
      where.assignments = {
        some: {
          AND: [
            { status: 'ACTIVE' as AssignmentStatus },
            employeeName ? {
              employee: {
                name: { contains: employeeName, mode: Prisma.QueryMode.insensitive }
              }
            } : {},
            employeeCode ? {
              employee: {
                employeeCode: { contains: employeeCode, mode: Prisma.QueryMode.insensitive }
              }
            } : {},
          ].filter(condition => Object.keys(condition).length > 0)
        }
      };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.createdAt = dateFilter;
    }

    // Execute count and data queries in parallel for better performance
    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
      where,
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            employee: {
              select: { id: true, name: true, employeeCode: true, email: true }
            }
          }
        },
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      success: true,
      data: assets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

    // Add cache control headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;

  } catch (error: unknown) {
    console.error('Assets API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetName, assetType, serialNumber, purchaseDate, description, notes } = body;

    // Validate required fields
    if (!assetName || !assetType) {
      return NextResponse.json(
        { success: false, error: 'Asset name and type are required' },
        { status: 400 }
      );
    }

    // Asset tag will be optional and not auto-generated

    // Check if serial number already exists (only if provided)
    if (serialNumber) {
      const existingAsset = await prisma.asset.findFirst({
        where: { serialNumber },
        select: { id: true } // Only select id for performance
      });
      if (existingAsset) {
        return NextResponse.json(
          { success: false, error: 'Serial number already exists' },
          { status: 400 }
        );
      }
    }

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        assetName,
        assetType,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate + 'T00:00:00.000Z') : null,
        condition: 'GOOD', // Default condition
        status: 'AVAILABLE',
        description: description || null,
        notes: notes || null,
      },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            employee: {
              select: { id: true, name: true, employeeCode: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: asset,
      message: 'Asset created successfully'
    });

  } catch (error: unknown) {
    console.error('Create Asset Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}