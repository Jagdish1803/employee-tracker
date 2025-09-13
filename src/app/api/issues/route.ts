// src/app/api/issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { createIssueSchema, employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/issues - Get issues with filters
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const issues = await prisma.issue.findMany({
      include: { employee: true },
      orderBy: [{ raisedDate: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch issues',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/issues - Create new issue
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const validatedData = createIssueSchema.parse(body);

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

    const issue = await prisma.issue.create({
      data: {
        ...validatedData,
        raisedDate: new Date(),
        daysElapsed: 0,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: issue,
      message: 'Issue created successfully',
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

    console.error('Error creating issue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create issue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}