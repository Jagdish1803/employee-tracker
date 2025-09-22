// Debug endpoint to check flowace data
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total count of flowace records
    const totalRecords = await prisma.flowaceRecord.count();

    // Get a few sample records
    const sampleRecords = await prisma.flowaceRecord.findMany({
      take: 5,
      select: {
        id: true,
        employeeId: true,
        employeeName: true,
        employeeCode: true,
        date: true,
        loggedHours: true,
        activeHours: true,
        productivityPercentage: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get unique employee IDs in flowace records
    const uniqueEmployeeIds = await prisma.flowaceRecord.findMany({
      select: {
        employeeId: true,
        employeeName: true
      },
      distinct: ['employeeId', 'employeeName']
    });

    // Get employee count
    const employeeCount = await prisma.employee.count();

    // Get a few sample employees
    const sampleEmployees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        employeeCode: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalFlowaceRecords: totalRecords,
        sampleFlowaceRecords: sampleRecords,
        uniqueEmployeeIds: uniqueEmployeeIds,
        totalEmployees: employeeCount,
        sampleEmployees: sampleEmployees
      }
    });

  } catch (error) {
    console.error('Debug flowace error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}