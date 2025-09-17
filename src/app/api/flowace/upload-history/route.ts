// src/app/api/flowace/upload-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// GET /api/flowace/upload-history - Get upload history
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    await ensureConnection();

    // Get upload history from database
    const dbHistory = await prisma.flowaceUploadHistory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match frontend expectations
    const history = dbHistory.map(record => ({
      id: record.id,
      batchId: record.batchId,
      filename: record.filename,
      status: record.status,
      totalRecords: record.totalRecords,
      processedRecords: record.processedRecords,
      errorRecords: record.errorRecords,
      uploadedAt: record.uploadedAt.toISOString(),
      errors: record.errors as Array<{ row: number; error: string }> | undefined,
      summary: record.summary as Record<string, unknown> | undefined
    }));

    console.log('Upload history GET: Returning', history.length, 'entries');

    return NextResponse.json({
      success: true,
      history: history,
      message: 'Upload history retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch upload history',
        history: []
      },
      { status: 500 }
    );
  }
}