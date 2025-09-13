// src/app/api/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { createAssignmentSchema, employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/assignments - Get assignments with optional filters
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/assignments called');
    
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    console.log('Query params:', query);

    let validatedQuery;
    try {
      validatedQuery = employeeQuerySchema.parse(query);
    } catch (validationError) {
      console.log('Query validation failed, using empty filter');
      validatedQuery = {};
    }

    await prisma.$connect();

    const where: any = {};
    if (validatedQuery.employeeId) {
      where.employeeId = validatedQuery.employeeId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        employee: true,
        tag: true,
      },
      orderBy: [
        { employee: { name: 'asc' } },
        { tag: { tagName: 'asc' } },
      ],
    });

    console.log(`Found ${assignments.length} assignments`);

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
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/assignments - Create new assignment
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/assignments called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = createAssignmentSchema.parse(body);
    console.log('Validated data:', validatedData);

    await prisma.$connect();

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
      console.log('Assignment already exists');
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment already exists for this employee and tag',
        },
        { status: 400 }
      );
    }

    // Verify employee and tag exist
    const [employee, tag] = await Promise.all([
      prisma.employee.findUnique({ where: { id: validatedData.employeeId } }),
      prisma.tag.findUnique({ where: { id: validatedData.tagId } }),
    ]);

    if (!employee) {
      console.log('Employee not found:', validatedData.employeeId);
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    if (!tag) {
      console.log('Tag not found:', validatedData.tagId);
      return NextResponse.json(
        {
          success: false,
          error: 'Tag not found',
        },
        { status: 404 }
      );
    }

    console.log('Creating assignment for:', employee.name, 'with tag:', tag.tagName);

    const assignment = await prisma.assignment.create({
      data: validatedData,
      include: {
        employee: true,
        tag: true,
      },
    });

    console.log('Assignment created successfully:', assignment.id);

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
  } finally {
    await prisma.$disconnect();
  }
}