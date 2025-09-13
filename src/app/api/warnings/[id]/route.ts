// src/app/api/warnings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateWarningSchema } from '@/lib/validations';
import { z } from 'zod';

// PUT /api/warnings/[id] - Update warning (mainly to dismiss)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid warning ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateWarningSchema.parse(body);

    await prisma.$connect();

    // Check if warning exists
    const existingWarning = await prisma.warning.findUnique({
      where: { id },
    });

    if (!existingWarning) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warning not found',
        },
        { status: 404 }
      );
    }

    const updatedWarning = await prisma.warning.update({
      where: { id },
      data: validatedData,
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedWarning,
      message: 'Warning updated successfully',
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

    console.error('Error updating warning:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update warning',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
