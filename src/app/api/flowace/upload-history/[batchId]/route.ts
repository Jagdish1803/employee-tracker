// src/app/api/flowace/upload-history/[batchId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// DELETE /api/flowace/upload-history/[batchId] - Delete upload history entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    await ensureConnection();

    const { batchId } = await params;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Delete from database
    await prisma.flowaceRecord.deleteMany({
      where: { batchId }
    });

    await prisma.flowaceUploadHistory.delete({
      where: { batchId }
    });

    return NextResponse.json({
      success: true,
      message: 'Upload history entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting upload history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete upload history entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}