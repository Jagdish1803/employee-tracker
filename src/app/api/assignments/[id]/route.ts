// src/app/api/assignments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  isMandatory: z.boolean().optional(),
});

// GET /api/assignments/[id] - Get assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assignment ID',
        },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        tagId: true,
        isMandatory: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
          }
        },
        tag: {
          select: {
            id: true,
            tagName: true,
            timeMinutes: true,
          }
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/assignments/[id] - Update assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assignment ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment not found',
        },
        { status: 404 }
      );
    }

    // Update assignment
    const assignment = await prisma.assignment.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        employeeId: true,
        tagId: true,
        isMandatory: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
          }
        },
        tag: {
          select: {
            id: true,
            tagName: true,
            timeMinutes: true,
          }
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    console.error('Error updating assignment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assignment ID',
        },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment not found',
        },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}