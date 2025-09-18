import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/assets/[id] - Get single asset with history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assetId = parseInt(id);

    if (isNaN(assetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID' },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        assignments: {
          include: {
            employee: {
              select: { id: true, name: true, employeeCode: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit to recent 10 assignments for performance
        },
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Limit to recent 5 maintenance logs for performance
        }
      }
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: asset
    });

  } catch (error: unknown) {
    console.error('Get Asset Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assetId = parseInt(id);
    const body = await request.json();

    if (isNaN(assetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!existingAsset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Check if serial number is being changed and if it already exists
    if (body.serialNumber && body.serialNumber !== existingAsset.serialNumber) {
      const duplicateAsset = await prisma.asset.findFirst({
        where: {
          serialNumber: body.serialNumber,
          id: { not: assetId }
        }
      });
      if (duplicateAsset) {
        return NextResponse.json(
          { success: false, error: 'Serial number already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data - only include fields we want to update
    const { assetName, assetType, serialNumber, purchaseDate, description, notes } = body;
    const updateData: Record<string, unknown> = {
      assetName,
      assetType,
      serialNumber: serialNumber || null,
      description: description || null,
      notes: notes || null,
    };

    if (purchaseDate) {
      updateData.purchaseDate = new Date(purchaseDate + 'T00:00:00.000Z');
    }
    if (body.warrantyExpiry) {
      updateData.warrantyExpiry = new Date(body.warrantyExpiry);
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
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
      data: updatedAsset,
      message: 'Asset updated successfully'
    });

  } catch (error: unknown) {
    console.error('Update Asset Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assetId = parseInt(id);

    if (isNaN(assetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        assignments: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!existingAsset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Check if asset is currently assigned
    if (existingAsset.assignments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete asset that is currently assigned' },
        { status: 400 }
      );
    }

    // Delete asset (cascade will handle assignments and maintenance logs)
    await prisma.asset.delete({
      where: { id: assetId }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Delete Asset Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}