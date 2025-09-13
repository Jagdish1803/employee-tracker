// src/app/api/breaks/in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { breakRequestSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/breaks/in - Start break
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = breakRequestSchema.parse(body);

    await prisma.$connect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee already has an active break
    const activeBreak = await prisma.break.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        isActive: true,
      },
    });

    if (activeBreak) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee already has an active break',
        },
        { status: 400 }
      );
    }

    // Create new break
    const newBreak = await prisma.break.create({
      data: {
        employeeId: validatedData.employeeId,
        breakDate: today,
        breakInTime: new Date(),
        isActive: true,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newBreak,
      message: 'Break started successfully',
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

    console.error('Error starting break:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start break',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}