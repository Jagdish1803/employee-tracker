// src/app/api/attendance/delete-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    
    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Missing batchId parameter' }, 
        { status: 400 }
      );
    }

    console.log('Deleting batch with ID:', batchId);

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, check if the batch exists in upload history
      const uploadHistory = await tx.uploadHistory.findFirst({
        where: { batchId }
      });

      if (!uploadHistory) {
        throw new Error('Batch not found');
      }

      console.log(`Deleting all attendance records for batch: ${batchId}`);

      // Delete ALL attendance records that belong to this batch
      // Use the importBatch field in attendanceRecord table
      const deletedRecords = await tx.attendanceRecord.deleteMany({
        where: { importBatch: batchId }
      });

      console.log(`Deleted ${deletedRecords.count} attendance records for batch ${batchId}`);

      // Delete upload history for this batch
      await tx.uploadHistory.deleteMany({
        where: { batchId }
      });

      console.log(`Deleted upload history for batch ${batchId}`);
    });

    console.log('Batch deleted successfully:', batchId);

    return NextResponse.json({ 
      success: true, 
      message: 'Batch and associated attendance records deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting batch:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to delete batch: ${errorMessage}` 
      }, 
      { status: 500 }
    );
  }
}
