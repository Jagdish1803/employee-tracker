// src/app/api/attendance/admin/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching upload history...');

    const uploadHistory = await prisma.uploadHistory.findMany({
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    console.log(`Found ${uploadHistory.length} upload history records`);
    console.log('Upload history records:', uploadHistory.map(h => ({ 
      id: h.id, 
      filename: h.filename, 
      status: h.status,
      uploadedAt: h.uploadedAt 
    })));

    return NextResponse.json(uploadHistory);

  } catch (error) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload history' },
      { status: 500 }
    );
  }
}