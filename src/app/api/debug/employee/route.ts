// Debug endpoint to check specific employee details
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required'
      }, { status: 400 });
    }

    // Get the specific employee
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        department: true
      }
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 });
    }

    // Get all employees to see the context
    const allEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        employeeCode: true
      },
      orderBy: { id: 'asc' }
    });

    // Get flowace records that might match this employee
    const potentialMatches = await prisma.flowaceRecord.findMany({
      where: {
        OR: [
          { employeeName: { contains: employee.name, mode: 'insensitive' } },
          { employeeName: { contains: employee.name.split(' ')[0], mode: 'insensitive' } },
          { employeeCode: employee.employeeCode }
        ]
      },
      select: {
        id: true,
        employeeName: true,
        employeeCode: true,
        date: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        employee: employee,
        allEmployees: allEmployees,
        potentialFlowaceMatches: potentialMatches,
        totalEmployees: allEmployees.length,
        matchCount: potentialMatches.length
      }
    });

  } catch (error) {
    console.error('Debug employee error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch employee data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}