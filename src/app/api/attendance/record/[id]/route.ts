// src/app/api/attendance/record/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Updating attendance record:', id, body);

    // Validate required fields
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid attendance record ID' },
        { status: 400 }
      );
    }

    // Check if this is an attendance table record (prefixed with 'att_')
    if (id.startsWith('att_')) {
      const numericId = parseInt(id.substring(4)); // Remove 'att_' prefix
      console.log('Updating attendance table record with numeric ID:', numericId);

      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: 'Invalid attendance record ID format' },
          { status: 400 }
        );
      }

      // Prepare update data for attendance table
      const updateData: Record<string, unknown> = {};
      if (body.status) updateData.status = body.status;
      if (body.checkInTime !== undefined) {
        updateData.checkInTime = body.checkInTime ?
          new Date(`2000-01-01T${body.checkInTime}:00`) : null;
      }
      if (body.checkOutTime !== undefined) {
        updateData.checkOutTime = body.checkOutTime ?
          new Date(`2000-01-01T${body.checkOutTime}:00`) : null;
      }
      if (body.lunchOutTime !== undefined) {
        updateData.lunchOutTime = body.lunchOutTime ?
          new Date(`2000-01-01T${body.lunchOutTime}:00`) : null;
      }
      if (body.lunchInTime !== undefined) {
        updateData.lunchInTime = body.lunchInTime ?
          new Date(`2000-01-01T${body.lunchInTime}:00`) : null;
      }
      if (body.hoursWorked !== undefined) updateData.hoursWorked = body.hoursWorked;
      if (body.shift !== undefined) updateData.shift = body.shift;
      if (body.shiftStart !== undefined) updateData.shiftStart = body.shiftStart;
      updateData.updatedAt = new Date();

      const updatedRecord = await prisma.attendance.update({
        where: { id: numericId },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              department: true
            }
          }
        }
      });

      console.log('Updated attendance record:', updatedRecord);

      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: 'Attendance record updated successfully'
      });
    } else {
      // This is an attendanceRecord table record
      const numericId = parseInt(id);
      console.log('Updating attendanceRecord table with ID:', numericId);

      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: 'Invalid attendance record ID format' },
          { status: 400 }
        );
      }

      // Prepare update data for attendanceRecord table
      const updateData: Record<string, unknown> = {};
      if (body.status) updateData.status = body.status;
      if (body.checkInTime !== undefined) {
        updateData.checkInTime = body.checkInTime ?
          new Date(`2000-01-01T${body.checkInTime}:00`) : null;
      }
      if (body.checkOutTime !== undefined) {
        updateData.checkOutTime = body.checkOutTime ?
          new Date(`2000-01-01T${body.checkOutTime}:00`) : null;
      }
      if (body.hoursWorked !== undefined) updateData.totalHours = body.hoursWorked;
      updateData.updatedAt = new Date();

      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: numericId },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              department: true
            }
          }
        }
      });

      console.log('Updated attendanceRecord:', updatedRecord);

      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: 'Attendance record updated successfully'
      });
    }

  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update attendance record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      console.log('Invalid ID provided:', id);
      return NextResponse.json(
        { error: 'Invalid attendance record ID' },
        { status: 400 }
      );
    }

    // Check if this is an attendance table record (prefixed with 'att_')
    if (id.startsWith('att_')) {
      const numericId = parseInt(id.substring(4)); // Remove 'att_' prefix

      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: 'Invalid attendance record ID format' },
          { status: 400 }
        );
      }

      await prisma.attendance.delete({
        where: { id: numericId }
      });
    } else {
      // This is an attendanceRecord table record
      const numericId = parseInt(id);

      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: 'Invalid attendance record ID format' },
          { status: 400 }
        );
      }

      await prisma.attendanceRecord.delete({
        where: { id: numericId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Error deleting attendance record:', error);

    // Handle Prisma NotFoundError
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
          details: 'The record you are trying to delete does not exist'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attendance record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
