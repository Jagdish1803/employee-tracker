import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
  try {
    console.log('🔍 Checking for existing logs in the database...\n');

    // Get all logs with employee and tag details
    const logs = await prisma.log.findMany({
      include: {
        employee: true,
        tag: true,
      },
      orderBy: {
        logDate: 'desc'
      }
    });

    console.log(`📊 Found ${logs.length} total logs in the database\n`);

    if (logs.length > 0) {
      console.log('Recent logs:');
      logs.slice(0, 10).forEach((log, index) => {
        console.log(`${index + 1}. Employee: ${log.employee?.name} (${log.employee?.employeeCode})`);
        console.log(`   Tag: ${log.tag?.tagName}`);
        console.log(`   Date: ${log.logDate.toISOString().split('T')[0]}`);
        console.log(`   Count: ${log.count}, Minutes: ${log.totalMinutes}`);
        console.log(`   Created: ${log.createdAt.toISOString()}\n`);
      });
    } else {
      console.log('❌ No logs found in the database');
    }

    // Check submission status
    console.log('📝 Checking submission status...\n');
    const submissions = await prisma.submissionStatus.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        submissionDate: 'desc'
      }
    });

    console.log(`📊 Found ${submissions.length} submissions in the database\n`);

    if (submissions.length > 0) {
      console.log('Recent submissions:');
      submissions.slice(0, 5).forEach((submission, index) => {
        console.log(`${index + 1}. Employee: ${submission.employee?.name} (${submission.employee?.employeeCode})`);
        console.log(`   Date: ${submission.submissionDate.toISOString().split('T')[0]}`);
        console.log(`   Total Minutes: ${submission.totalMinutes}`);
        console.log(`   Status: ${submission.statusMessage}`);
        console.log(`   Locked: ${submission.isLocked}\n`);
      });
    } else {
      console.log('❌ No submissions found in the database');
    }

    // Check employees with assignments
    console.log('👥 Checking employees with assignments...\n');
    const employeesWithAssignments = await prisma.employee.findMany({
      include: {
        assignments: {
          include: {
            tag: true
          }
        }
      },
      where: {
        assignments: {
          some: {}
        }
      }
    });

    console.log(`📊 Found ${employeesWithAssignments.length} employees with assignments\n`);

    employeesWithAssignments.forEach((employee, index) => {
      console.log(`${index + 1}. ${employee.name} (${employee.employeeCode})`);
      console.log(`   Assignments: ${employee.assignments.length}`);
      employee.assignments.slice(0, 3).forEach(assignment => {
        console.log(`   - ${assignment.tag?.tagName} (${assignment.isMandatory ? 'Mandatory' : 'Optional'})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogs();