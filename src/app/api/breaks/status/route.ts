import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/breaks/status - Get current break status for employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = employeeQuerySchema.parse(query);

    if (!validatedQuery.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required',
        },
        { status: 400 }
      );
    }

  await ensureConnection();

    const activeBreak = await prisma.break.findFirst({
      where: {
        employeeId: validatedQuery.employeeId,
        isActive: true,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: activeBreak,
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

    console.error('Error fetching break status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch break status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}