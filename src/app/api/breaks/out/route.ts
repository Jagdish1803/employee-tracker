// src/app/api/breaks/out/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { breakRequestSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/breaks/out - End break
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = breakRequestSchema.parse(body);

    await prisma.$connect();

    // Find active break
    const activeBreak = await prisma.break.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        isActive: true,
      },
    });

    if (!activeBreak) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active break found for this employee',
        },
        { status: 400 }
      );
    }

    const breakOutTime = new Date();
    const breakDuration = Math.floor(
      (breakOutTime.getTime() - new Date(activeBreak.breakInTime!).getTime()) / (1000 * 60)
    );

    // Update break
    const updatedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        breakOutTime,
        breakDuration,
        isActive: false,
      },
      include: {
        employee: true,
      },
    });

    // Create warning if break exceeded 20 minutes
    if (breakDuration > 20 && !activeBreak.warningSent) {
      await prisma.warning.create({
        data: {
          employeeId: validatedData.employeeId,
          warningDate: new Date(),
          warningMessage: `Break exceeded 20 minutes (${breakDuration} minutes)`,
          isActive: true,
        },
      });

      await prisma.break.update({
        where: { id: activeBreak.id },
        data: { warningSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedBreak,
      message: 'Break ended successfully',
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

    console.error('Error ending break:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to end break',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}