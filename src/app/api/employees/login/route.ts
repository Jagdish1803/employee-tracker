// src/app/api/employees/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { employeeLoginSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/employees/login - Employee login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = employeeLoginSchema.parse(body);

    await prisma.$connect();

    const employee = await prisma.employee.findFirst({
      where: {
        employeeCode: validatedData.employeeCode,
      },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employee code',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Login successful',
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

    console.error('Error during employee login:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}