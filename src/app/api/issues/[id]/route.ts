// src/app/api/issues/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateIssueSchema } from '@/lib/validations';
import { z } from 'zod';

// PUT /api/issues/[id] - Update issue
export async function PUT(
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
          error: 'Invalid issue ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateIssueSchema.parse(body);

    await prisma.$connect();

    // Check if issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue not found',
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = { ...validatedData };

    // Set resolved date if status is being changed to resolved
    if (validatedData.issueStatus === 'resolved' && existingIssue.issueStatus !== 'resolved') {
      updateData.resolvedDate = new Date();
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: 'Issue updated successfully',
    });
  } catch (error) {
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

    console.error('Error updating issue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update issue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}