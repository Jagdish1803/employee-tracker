// src/app/api/assignments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/assignments/[id] - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid assignment ID',
        },
        { status: 400 }
      );
    }

    await prisma.$connect();

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
  } finally {
    await prisma.$disconnect();
  }
}