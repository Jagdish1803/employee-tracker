// src/app/api/breaks/warning/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendWarningSchema = z.object({
  employeeId: z.number().positive(),
  breakId: z.number().positive(),
});

// POST /api/breaks/warning - Send warning for extended break
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendWarningSchema.parse(body);

    await prisma.$connect();

    // Check if break exists and is valid for warning
    const breakRecord = await prisma.break.findUnique({
      where: { id: validatedData.breakId },
      include: { employee: true },
    });

    if (!breakRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Break record not found',
        },
        { status: 404 }
      );
    }

    if (breakRecord.employeeId !== validatedData.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Break does not belong to this employee',
        },
        { status: 400 }
      );
    }

    if (breakRecord.warningSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warning already sent for this break',
        },
        { status: 400 }
      );
    }

    // Calculate break duration
    const duration = breakRecord.breakInTime ? Math.floor(
      (new Date().getTime() - new Date(breakRecord.breakInTime).getTime()) / (1000 * 60)
    ) : 0;

    if (duration <= 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Break has not exceeded 20 minutes',
        },
        { status: 400 }
      );
    }

    // Create warning record
    await prisma.warning.create({
      data: {
        employeeId: validatedData.employeeId,
        warningDate: new Date(),
        warningMessage: `Break exceeded 20 minutes (${duration} minutes)`,
        isActive: true,
      },
    });

    // Mark warning as sent for this break
    await prisma.break.update({
      where: { id: validatedData.breakId },
      data: { warningSent: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Warning sent successfully',
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

    console.error('Error sending break warning:', error);
    return NextResponse.json(
      {
        success: false ,
        error: 'Failed to send warning',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  } 
}