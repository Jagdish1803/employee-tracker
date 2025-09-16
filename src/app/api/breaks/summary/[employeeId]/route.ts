import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const date = req.nextUrl.searchParams.get('date');
  console.log('Break summary API called with:', { employeeId, date });
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
    });
    const totalBreaks = breaks.length;
    const totalMinutes = breaks.reduce((sum: number, b: { breakOutTime?: Date | null; breakInTime?: Date | null }) => {
      if (b.breakOutTime && b.breakInTime) {
        return sum + Math.round((b.breakOutTime.getTime() - b.breakInTime.getTime()) / 60000);
      }
      return sum;
    }, 0);
    const avgMinutes = totalBreaks > 0 ? Math.round(totalMinutes / totalBreaks) : 0;
    return new Response(JSON.stringify({ success: true, data: { totalBreaks, totalMinutes, avgMinutes } }), { status: 200 });
  } catch (error) {
    console.error('Break summary API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch break summary', details: error instanceof Error ? error.message : error }), { status: 500 });
  }
}
