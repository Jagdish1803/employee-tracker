import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateEmployeeSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/employees/[id] - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employee ID',
        },
        { status: 400 }
      );
    }

    await prisma.$connect();
    
    const employee = await prisma.employee.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employee ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    await prisma.$connect();

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Check if email or employee code conflicts with other employees
    if (validatedData.email || validatedData.employeeCode) {
      const conflictingEmployee = await prisma.employee.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Exclude current employee
            {
              OR: [
                validatedData.email ? { email: validatedData.email } : {},
                validatedData.employeeCode ? { employeeCode: validatedData.employeeCode } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (conflictingEmployee) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee with this email or employee code already exists',
          },
          { status: 400 }
        );
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
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

    console.error('Error updating employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid employee ID',
        },
        { status: 400 }
      );
    }

    await prisma.$connect();

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Delete employee (this will cascade delete related records due to Prisma schema)
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete employee with existing work logs or assignments',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}