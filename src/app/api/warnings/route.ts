// src/app/api/warnings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { createWarningSchema, employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';
import { WarningType } from '@prisma/client';

// GET /api/warnings - Get warnings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = employeeQuerySchema.parse(query);

  await ensureConnection();

    const where: any = {};

    if (validatedQuery.employeeId) {
      where.employeeId = validatedQuery.employeeId;
    }

    if (validatedQuery.active !== undefined) {
      where.isActive = validatedQuery.active;
    }

    const warnings = await prisma.warning.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: [
        { warningDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: warnings,
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

    console.error('Error fetching warnings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/warnings - Create new warning
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const validatedData = createWarningSchema.parse(body);

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    const warning = await prisma.warning.create({
      data: {
        ...validatedData,
        warningDate: validatedData.warningDate ? new Date(validatedData.warningDate) : new Date(),
        warningType: validatedData.warningType as WarningType,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: warning,
      message: 'Warning created successfully',
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

    console.error('Error creating warning:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create warning',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}