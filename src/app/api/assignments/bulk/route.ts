// src/app/api/assignments/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBulkAssignmentSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/assignments/bulk - Create multiple assignments for one employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createBulkAssignmentSchema.parse(body);

    // Verify all employees and tags exist in parallel
    const [employees, tags] = await Promise.all([
      prisma.employee.findMany({
        where: { id: { in: validatedData.employeeIds } },
        select: { id: true, name: true }
      }),
      prisma.tag.findMany({
        where: { id: { in: validatedData.tagIds } },
        select: { id: true, tagName: true }
      })
    ]);

    if (employees.length !== validatedData.employeeIds.length) {
      const missingEmployeeIds = validatedData.employeeIds.filter(
        id => !employees.find(emp => emp.id === id)
      );
      return NextResponse.json(
        {
          success: false,
          error: `Employees not found: ${missingEmployeeIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    if (tags.length !== validatedData.tagIds.length) {
      const missingTagIds = validatedData.tagIds.filter(
        tagId => !tags.find(tag => tag.id === tagId)
      );
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
        employeeId: { in: validatedData.employeeIds },
        tagId: { in: validatedData.tagIds }
      },
      select: {
        employeeId: true,
        tagId: true,
        employee: { select: { name: true } },
        tag: { select: { tagName: true } }
      }
    });

    if (existingAssignments.length > 0) {
      const existingInfo = existingAssignments.map(a => `${a.employee?.name} - ${a.tag?.tagName}`).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `Assignments already exist for: ${existingInfo}`,
        },
        { status: 400 }
      );
    }

    // Create all assignments in a transaction with optimized select
    const assignments = await prisma.$transaction(
      validatedData.employeeIds.flatMap(employeeId =>
        validatedData.tagIds.map(tagId =>
          prisma.assignment.create({
            data: {
              employeeId,
              tagId,
              isMandatory: validatedData.isMandatory,
            },
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
          })
        )
      )
    );

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
