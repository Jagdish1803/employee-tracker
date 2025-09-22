// Fix flowace employee associations
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Starting flowace employee association fix...');

    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        employeeCode: true
      }
    });

    // Get all flowace records with null employeeId
    const flowaceRecords = await prisma.flowaceRecord.findMany({
      where: {
        employeeId: null
      },
      select: {
        id: true,
        employeeName: true,
        employeeCode: true
      }
    });

    console.log(`Found ${employees.length} employees and ${flowaceRecords.length} unlinked flowace records`);

    const updates: Array<{ flowaceId: string; employeeId: number; match: string }> = [];
    const unmatched: Array<{ flowaceName: string; reason: string }> = [];

    // Try to match flowace records to employees
    for (const flowaceRecord of flowaceRecords) {
      let matchedEmployee = null;
      let matchReason = '';

      // Try exact name match first
      matchedEmployee = employees.find(emp =>
        emp.name.toLowerCase().trim() === flowaceRecord.employeeName.toLowerCase().trim()
      );
      if (matchedEmployee) {
        matchReason = 'exact name match';
      }

      // Try partial name match (flowace name contains employee name or vice versa)
      if (!matchedEmployee) {
        matchedEmployee = employees.find(emp => {
          const empName = emp.name.toLowerCase().trim();
          const flowaceName = flowaceRecord.employeeName.toLowerCase().trim();
          return empName.includes(flowaceName) || flowaceName.includes(empName);
        });
        if (matchedEmployee) {
          matchReason = 'partial name match';
        }
      }

      // Try matching by first name only
      if (!matchedEmployee) {
        const flowaceFirstName = flowaceRecord.employeeName.split(' ')[0].toLowerCase().trim();
        matchedEmployee = employees.find(emp =>
          emp.name.toLowerCase().trim().startsWith(flowaceFirstName)
        );
        if (matchedEmployee) {
          matchReason = 'first name match';
        }
      }

      // Special case mappings for known variations
      const specialMappings: Record<string, string> = {
        'naryan yadav': 'narayan',
        'nandini k': 'nandini',
        'divya  gatkal': 'divya',
        'prarthana g': 'prarthana'
      };

      if (!matchedEmployee) {
        const normalizedFlowaceName = flowaceRecord.employeeName.toLowerCase().trim();
        const mappedName = specialMappings[normalizedFlowaceName];
        if (mappedName) {
          matchedEmployee = employees.find(emp =>
            emp.name.toLowerCase().trim() === mappedName
          );
          if (matchedEmployee) {
            matchReason = 'special mapping';
          }
        }
      }

      if (matchedEmployee) {
        updates.push({
          flowaceId: flowaceRecord.id,
          employeeId: matchedEmployee.id,
          match: `${flowaceRecord.employeeName} → ${matchedEmployee.name} (${matchReason})`
        });
      } else {
        unmatched.push({
          flowaceName: flowaceRecord.employeeName,
          reason: 'no suitable employee match found'
        });
      }
    }

    console.log(`Prepared ${updates.length} updates and ${unmatched.length} unmatched records`);

    // Apply the updates
    const updateResults = [];
    for (const update of updates) {
      try {
        await prisma.flowaceRecord.update({
          where: { id: update.flowaceId },
          data: { employeeId: update.employeeId }
        });
        updateResults.push({
          success: true,
          flowaceId: update.flowaceId,
          employeeId: update.employeeId,
          match: update.match
        });
      } catch (error) {
        updateResults.push({
          success: false,
          flowaceId: update.flowaceId,
          employeeId: update.employeeId,
          match: update.match,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = updateResults.filter(r => r.success).length;

    console.log(`Successfully updated ${successCount} flowace records`);

    return NextResponse.json({
      success: true,
      data: {
        totalFlowaceRecords: flowaceRecords.length,
        totalEmployees: employees.length,
        successfulUpdates: successCount,
        failedUpdates: updateResults.length - successCount,
        updates: updateResults,
        unmatched: unmatched
      },
      message: `Successfully linked ${successCount} flowace records to employees`
    });

  } catch (error) {
    console.error('Error fixing flowace associations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix flowace associations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}