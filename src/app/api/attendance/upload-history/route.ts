// src/app/api/attendance/upload-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Query UploadHistory table instead of ImportLog
    const uploadHistory = await prisma.uploadHistory.findMany({
      orderBy: {
        uploadedAt: 'desc'
      },
      take: 50 // Limit to last 50 uploads
    });

    console.log(`Found ${uploadHistory.length} upload history records`);

    return NextResponse.json({
      success: true,
      data: uploadHistory
    });

  } catch (error) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch upload history',
        data: []
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Upload history ID is required' },
        { status: 400 }
      );
    }

    // Delete from UploadHistory table directly
    await prisma.uploadHistory.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Upload history deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting upload history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete upload history' 
      },
      { status: 500 }
    );
  }
}
     