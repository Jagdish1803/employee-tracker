// src/app/api/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAssignmentSchema, employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/assignments - Get assignments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = employeeQuerySchema.parse(query);
    } catch {
      validatedQuery = {};
    }

    const where: Record<string, unknown> = {};
    if (validatedQuery.employeeId) {
      where.employeeId = validatedQuery.employeeId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        tagId: true,
        isMandatory: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
          }
        },
        tag: {
          select: {
            id: true,
            tagName: true,
            timeMinutes: true,
          }
        },
      },
      orderBy: [
        { employee: { name: 'asc' } },
        { tag: { tagName: 'asc' } },
      ],
    });

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Error in GET /api/assignments:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAssignmentSchema.parse(body);

    // Check if assignment already exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        employee_tag: {
          employeeId: validatedData.employeeId,
          tagId: validatedData.tagId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment already exists for this employee and tag',
        },
        { status: 400 }
      );
    }

    // Verify employee and tag exist in a single query
    const [employee, tag] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: validatedData.employeeId },
        select: { id: true, name: true }
      }),
      prisma.tag.findUnique({
        where: { id: validatedData.tagId },
        select: { id: true, tagName: true }
      }),
    ]);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tag not found',
        },
        { status: 404 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: validatedData,
      select: {
        id: true,
        employeeId: true,
        tagId: true,
        isMandatory: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
          }
        },
        tag: {
          select: {
            id: true,
            tagName: true,
            timeMinutes: true,
          }
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/assignments:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}