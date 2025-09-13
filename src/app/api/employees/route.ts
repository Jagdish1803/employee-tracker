// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { createEmployeeSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/employees - Get all employees
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    await ensureConnection();
    
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    
    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    // Check if employee with same email or employee code exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { employeeCode: validatedData.employeeCode },
        ],
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee with this email or employee code already exists',
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
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

    console.error('Error creating employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}