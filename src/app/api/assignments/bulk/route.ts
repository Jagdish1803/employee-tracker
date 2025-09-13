// src/app/api/assignments/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBulkAssignmentSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/assignments/bulk - Create multiple assignments for one employee
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/assignments/bulk called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = createBulkAssignmentSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Verify employee exists
    const employee = await prisma.employee.findUnique({ 
      where: { id: validatedData.employeeId } 
    });

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

    // Verify all tags exist
    const tags = await prisma.tag.findMany({
      where: { 
        id: { in: validatedData.tagIds } 
      }
    });

    if (tags.length !== validatedData.tagIds.length) {
      const missingTagIds = validatedData.tagIds.filter(
        tagId => !tags.find(tag => tag.id === tagId)
      );
      console.log('Tags not found:', missingTagIds);
      return NextResponse.json(
        {
          success: false,
          error: `Tags not found: ${missingTagIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    // Check for existing assignments
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        employeeId: validatedData.employeeId,
        tagId: { in: validatedData.tagIds }
      },
      include: { tag: true }
    });

    if (existingAssignments.length > 0) {
      const existingTagNames = existingAssignments.map(a => a.tag?.tagName).join(', ');
      console.log('Some assignments already exist:', existingTagNames);
      return NextResponse.json(
        {
          success: false,
          error: `Assignments already exist for these tags: ${existingTagNames}`,
        },
        { status: 400 }
      );
    }

    console.log('Creating bulk assignments for:', employee.name, 'with tags:', tags.map(t => t.tagName).join(', '));

    // Create all assignments in a transaction
    const assignments = await prisma.$transaction(
      validatedData.tagIds.map(tagId =>
        prisma.assignment.create({
          data: {
            employeeId: validatedData.employeeId,
            tagId: tagId,
            isMandatory: validatedData.isMandatory,
          },
          include: {
            employee: true,
            tag: true,
          },
        })
      )
    );

    console.log(`Created ${assignments.length} assignments successfully`);

    return NextResponse.json({
      success: true,
      data: assignments,
      message: `Created ${assignments.length} assignments successfully`,
    });
  } catch (error) {
    console.error('Error in POST /api/assignments/bulk:', error);
    
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
        error: 'Failed to create bulk assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
