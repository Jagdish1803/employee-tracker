// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentISTDate } from '@/lib/utils';

// GET /api/dashboard/stats - Get dashboard statistics
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    await prisma.$connect();

    const today = getCurrentISTDate();
    
    // Get total employees
    const totalEmployees = await prisma.employee.count();
    
    // Get total tags
    const totalTags = await prisma.tag.count();
    
    // Get today's submissions (unique employees who submitted today)
    const todaysLogs = await prisma.log.findMany({
      where: {
        logDate: new Date(today),
      },
      select: {
        employeeId: true,
      },
      distinct: ['employeeId'],
    });
    const todaysSubmissions = todaysLogs.length;
    
    // Get pending issues
    const pendingIssues = await prisma.issue.count({
      where: {
        issueStatus: 'pending',
      },
    });

    const stats = {
      totalEmployees,
      totalTags,
      todaysSubmissions,
      pendingIssues,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}