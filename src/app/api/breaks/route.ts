// src/app/api/breaks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/breaks - Get breaks with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    let validatedQuery;
    try {
      validatedQuery = employeeQuerySchema.parse(query);
    } catch (validationError) {
      validatedQuery = {};
    }

    await prisma.$connect();

    const where: any = {};

    if (validatedQuery.employeeId) {
      where.employeeId = validatedQuery.employeeId;
    }

    if (validatedQuery.breakDate) {
      const breakDate = new Date(validatedQuery.breakDate);
      where.breakDate = {
        gte: new Date(breakDate.setHours(0, 0, 0, 0)),
        lte: new Date(breakDate.setHours(23, 59, 59, 999)),
      };
    }

    if (validatedQuery.dateFrom && validatedQuery.dateTo) {
      where.breakDate = {
        gte: new Date(validatedQuery.dateFrom),
        lte: new Date(validatedQuery.dateTo),
      };
    }

    if (validatedQuery.active !== undefined) {
      where.isActive = validatedQuery.active;
    }

    const breaks = await prisma.break.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: [
        { breakDate: 'desc' },
        { breakInTime: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: breaks,
    });
  } catch (error) {
    console.error('Error fetching breaks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch breaks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}