// src/app/api/logs/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { employeeQuerySchema } from '@/lib/validations';

// GET /api/logs/summary - Get logs summary for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = employeeQuerySchema.parse(query);

    if (!validatedQuery.employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee ID is required',
        },
        { status: 400 }
      );
    }

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get today's logs
    const todayLogs = await prisma.log.findMany({
      where: {
        employeeId: validatedQuery.employeeId,
        logDate: {
          gte: new Date(today.toISOString().split('T')[0]),
          lte: new Date(today.toISOString().split('T')[0]),
        },
      },
      include: {
        tag: true,
      },
    });

    // Get weekly logs
    const weeklyLogs = await prisma.log.findMany({
      where: {
        employeeId: validatedQuery.employeeId,
        logDate: {
          gte: weekAgo,
          lte: today,
        },
      },
      include: {
        tag: true,
      },
    });

    // Calculate summary statistics
    const todayTotal = todayLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
    const weeklyTotal = weeklyLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
    const uniqueDays = new Set(weeklyLogs.map(log => log.logDate.toDateString())).size;
    const averagePerDay = uniqueDays > 0 ? Math.round(weeklyTotal / uniqueDays) : 0;

    const summary = {
      today: {
        logs: todayLogs,
        totalMinutes: todayTotal,
        totalEntries: todayLogs.length,
      },
      weekly: {
        logs: weeklyLogs,
        totalMinutes: weeklyTotal,
        daysWorked: uniqueDays,
        averagePerDay,
      },
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching logs summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logs summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}