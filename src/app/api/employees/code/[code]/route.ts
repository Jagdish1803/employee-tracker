// src/app/api/employees/code/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// GET /api/employees/code/[code] - Get employee by employee code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await ensureConnection();

    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Employee code is required' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: {
        employeeCode: code,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        role: true,
        department: true,
        designation: true,
        joinDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { success: false, error: 'Employee account is inactive' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee by code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}