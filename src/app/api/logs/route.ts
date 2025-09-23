import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { submitLogSchema, employeeQuerySchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/logs - Get logs with filters
export async function GET(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const validatedQuery = employeeQuerySchema.parse(query);

    const where: Record<string, unknown> = {};

    if (validatedQuery.employeeId) {
      where.employeeId = validatedQuery.employeeId;
    }

    if (validatedQuery.logDate) {
      where.logDate = new Date(validatedQuery.logDate);
    }

    if (validatedQuery.dateFrom && validatedQuery.dateTo) {
      where.logDate = {
        gte: new Date(validatedQuery.dateFrom),
        lte: new Date(validatedQuery.dateTo),
      };
    }


    const logs = await prisma.log.findMany({
      where,
      include: {
        employee: true,
        tag: true,
      },
      orderBy: [
        { logDate: 'desc' },
        { employee: { name: 'asc' } },
        { tag: { tagName: 'asc' } },
      ],
    });


    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('GET /api/logs - Validation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error,
        },
        { status: 400 }
      );
    }

    console.error('GET /api/logs - Error fetching logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/logs - Submit work logs
export async function POST(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();

    const validatedData = submitLogSchema.parse(body);

    // Check if data already submitted and locked for this date
    const existingSubmission = await prisma.submissionStatus.findUnique({
      where: {
        employee_date: {
          employeeId: validatedData.employeeId,
          submissionDate: new Date(validatedData.logDate),
        },
      },
    });

    if (existingSubmission?.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data already submitted and locked for this date',
        },
        { status: 400 }
      );
    }

    // Get employee's mandatory tags to check for missing data
    const mandatoryAssignments = await prisma.assignment.findMany({
      where: {
        employeeId: validatedData.employeeId,
        isMandatory: true,
      },
      include: {
        tag: true,
      },
    });

    let totalMinutes = 0;
    let missingMandatory = false;

    // Process each log entry
    for (const logEntry of validatedData.logs) {
      // Get tag details
      const tag = await prisma.tag.findUnique({
        where: { id: logEntry.tagId },
      });

      if (!tag) {
        continue;
      }

      const minutes = logEntry.count * (tag.timeMinutes ?? 0);
      totalMinutes += minutes;

      // Save or update log
      const savedLog = await prisma.log.upsert({
        where: {
          employee_tag_date: {
            employeeId: validatedData.employeeId,
            tagId: logEntry.tagId,
            logDate: new Date(validatedData.logDate),
          },
        },
        update: {
          count: logEntry.count,
          totalMinutes: minutes,
        },
        create: {
          employeeId: validatedData.employeeId,
          tagId: logEntry.tagId,
          count: logEntry.count,
          totalMinutes: minutes,
          logDate: new Date(validatedData.logDate),
        },
      });
    }

    // Check for missing mandatory tags
    for (const mandatory of mandatoryAssignments) {
      const submittedLog = validatedData.logs.find(log => log.tagId === mandatory.tagId);
      if (!submittedLog || submittedLog.count === 0) {
        missingMandatory = true;
        break;
      }
    }

    // Record submission status
    await prisma.submissionStatus.upsert({
      where: {
        employee_date: {
          employeeId: validatedData.employeeId,
          submissionDate: new Date(validatedData.logDate),
        },
      },
      update: {
        submissionTime: new Date(),
        isLocked: true,
        totalMinutes,
        statusMessage: missingMandatory ? 'Submitted with missing mandatory tags' : 'Data submitted successfully',
      },
      create: {
        employeeId: validatedData.employeeId,
        submissionDate: new Date(validatedData.logDate),
        submissionTime: new Date(),
        isLocked: true,
        totalMinutes,
        statusMessage: missingMandatory ? 'Submitted with missing mandatory tags' : 'Data submitted successfully',
      },
    });

    // Create warning if mandatory tags are missing
    if (missingMandatory) {
      await prisma.warning.create({
        data: {
          employeeId: validatedData.employeeId,
          warningType: 'ATTENDANCE', // or another valid WarningType
          warningDate: new Date(validatedData.logDate),
          warningMessage: 'Mandatory tags were not filled',
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Work log submitted and locked successfully',
      data: { totalMinutes, missingMandatory },
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

    console.error('Error submitting logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit logs',
      },
      { status: 500 }
    );
  }
}