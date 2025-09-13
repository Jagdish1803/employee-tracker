// src/app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateLogSchema } from '@/lib/validations';
import { z } from 'zod';

// PUT /api/logs/[id] - Update log entry
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
          error: 'Invalid log ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateLogSchema.parse(body);

    // Check if log exists
    const existingLog = await prisma.log.findUnique({
      where: { id },
      include: {
        tag: true,
        employee: true,
      },
    });

    if (!existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: 'Log not found',
        },
        { status: 404 }
      );
    }

    // Calculate new total minutes
    const newTotalMinutes = validatedData.count * (existingLog.tag?.timeMinutes || 0);

    // Update log
    const updatedLog = await prisma.log.update({
      where: { id },
      data: {
        count: validatedData.count,
        totalMinutes: newTotalMinutes,
      },
      include: {
        employee: true,
        tag: true,
      },
    });

    // Update submission status total minutes
    const logDate = new Date(existingLog.logDate);
    const allEmployeeLogs = await prisma.log.findMany({
      where: {
        employeeId: existingLog.employeeId,
        logDate: logDate,
      },
    });

    const totalMinutesForDate = allEmployeeLogs.reduce((sum, log) => {
      return sum + (log.id === id ? newTotalMinutes : log.totalMinutes);
    }, 0);

    // Update submission status if exists
    await prisma.submissionStatus.updateMany({
      where: {
        employeeId: existingLog.employeeId,
        submissionDate: logDate,
      },
      data: {
        totalMinutes: totalMinutesForDate,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLog,
      message: 'Log updated successfully',
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

    console.error('Error updating log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update log',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}