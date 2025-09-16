import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { updateTagSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/tags/[id] - Get single tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tag ID',
        },
        { status: 400 }
      );
    }

    await prisma.$connect();
    
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tag not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tag ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTagSchema.parse(body);

    await prisma.$connect();

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tag not found',
        },
        { status: 404 }
      );
    }

    // Check if tag name conflicts with other tags
    if (validatedData.tagName) {
      const conflictingTag = await prisma.tag.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { tagName: validatedData.tagName },
          ],
        },
      });

      if (conflictingTag) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tag with this name already exists',
          },
          { status: 400 }
        );
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully',
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

    console.error('Error updating tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tag ID',
        },
        { status: 400 }
      );
    }

    // Use the shared connection helper
    await ensureConnection();

    // Delete tag directly - let database handle existence check
    const deletedTag = await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
      data: deletedTag,
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tag not found',
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete tag with existing assignments or work logs',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}