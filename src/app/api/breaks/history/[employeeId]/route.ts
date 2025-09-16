import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const date = req.nextUrl.searchParams.get('date');
  console.log('Break history API called with:', { employeeId, date });
  if (!employeeId || !date) {
    console.error('Missing employeeId or date');
    return new Response(JSON.stringify({ success: false, error: 'Missing employeeId or date' }), { status: 400 });
  }
  try {
    const breaks = await prisma.break.findMany({
      where: {
        employeeId: Number(employeeId),
        breakInTime: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lte: new Date(date + 'T23:59:59.999Z'),
        },
      },
      orderBy: { breakInTime: 'asc' },
    });
    return new Response(JSON.stringify({ success: true, data: breaks }), { status: 200 });
  } catch (error) {
    console.error('Break history API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch break history',
        details: error instanceof Error ? error.message : error,
      }),
      { status: 500 },
    );
  }
}
