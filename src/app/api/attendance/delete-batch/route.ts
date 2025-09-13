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
      // First, get the upload history to check if we need to delete attendance records
      const uploadHistory = await tx.uploadHistory.findMany({
        where: { batchId }
      });

      if (uploadHistory.length === 0) {
        throw new Error('Batch not found');
      }

      // Delete attendance records that were imported from this batch
      // Only delete records with source 'SRP_FILE' that match the upload dates
      for (const upload of uploadHistory) {
        if (upload.uploadedAt) {
          const startOfDay = new Date(upload.uploadedAt);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(upload.uploadedAt);
          endOfDay.setHours(23, 59, 59, 999);
          
          await tx.attendance.deleteMany({
            where: {
              AND: [
                { source: 'SRP_FILE' },
                { createdAt: { gte: startOfDay, lte: endOfDay } }
              ]
            }
          });
        }
      }
      
      // Delete import logs for this batch
      await tx.importLog.deleteMany({ 
        where: { batchId } 
      });
      
      // Delete upload history for this batch
      await tx.uploadHistory.deleteMany({ 
        where: { batchId } 
      });
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
