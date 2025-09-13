// src/app/api/attendance/admin/history/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid upload history ID' },
        { status: 400 }
      );
    }

    console.log('Deleting upload history:', id);

    await prisma.uploadHistory.delete({
      where: { id }
    });

    console.log('Upload history deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Upload history deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting upload history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete upload history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}