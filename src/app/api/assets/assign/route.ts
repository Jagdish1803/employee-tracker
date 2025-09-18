import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/assets/assign - Assign asset to employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, employeeId, assignmentNotes, assignedBy } = body;

    // Validate required fields
    if (!assetId || !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Asset ID and Employee ID are required' },
        { status: 400 }
      );
    }

    // Check asset and employee existence in parallel for better performance
    const [asset, employee] = await Promise.all([
      prisma.asset.findUnique({
        where: { id: parseInt(assetId) },
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
            take: 1 // Limit to 1 since we only need to check existence
          }
        }
      }),
      prisma.employee.findUnique({
        where: { id: parseInt(employeeId) }
      })
    ]);

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    if (asset.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Asset is not available for assignment' },
        { status: 400 }
      );
    }

    if (asset.assignments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Asset is already assigned to someone' },
        { status: 400 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create assignment and update asset status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create assignment
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: parseInt(assetId),
          employeeId: parseInt(employeeId),
          assignedBy: assignedBy ? parseInt(assignedBy) : null,
          assignmentNotes: assignmentNotes || null,
          status: 'ACTIVE'
        },
        include: {
          asset: true,
          employee: {
            select: { id: true, name: true, employeeCode: true, email: true }
          }
        }
      });

      // Update asset status
      const updatedAsset = await tx.asset.update({
        where: { id: parseInt(assetId) },
        data: { status: 'ASSIGNED' }
      });

      return { assignment, asset: updatedAsset };
    });

    return NextResponse.json({
      success: true,
      data: result.assignment,
      message: `Asset successfully assigned to ${employee.name}`
    });

  } catch (error: unknown) {
    console.error('Asset Assignment Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/assign - Return asset (end assignment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, returnCondition, returnNotes, returnedBy } = body;

    // Validate required fields
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Check if assignment exists and is active
    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: parseInt(assignmentId) },
      include: {
        asset: true,
        employee: {
          select: { id: true, name: true, employeeCode: true, email: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Assignment is not active' },
        { status: 400 }
      );
    }

    // Return asset and update both assignment and asset in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment
      const updatedAssignment = await tx.assetAssignment.update({
        where: { id: parseInt(assignmentId) },
        data: {
          status: 'RETURNED',
          returnDate: new Date(),
          returnCondition: returnCondition || null,
          returnNotes: returnNotes || null,
          returnedBy: returnedBy ? parseInt(returnedBy) : null
        },
        include: {
          asset: true,
          employee: {
            select: { id: true, name: true, employeeCode: true, email: true }
          }
        }
      });

      // Update asset status and condition
      const updatedAsset = await tx.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: 'AVAILABLE',
          condition: returnCondition || assignment.asset.condition
        }
      });

      return { assignment: updatedAssignment, asset: updatedAsset };
    });

    return NextResponse.json({
      success: true,
      data: result.assignment,
      message: `Asset successfully returned by ${assignment.employee.name}`
    });

  } catch (error: unknown) {
    console.error('Asset Return Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to return asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}