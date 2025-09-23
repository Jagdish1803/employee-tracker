import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleBreaks() {
  try {
    console.log('Adding sample break records...');

    // Get employee with code ZOOT1086
    const employee = await prisma.employee.findUnique({
      where: { employeeCode: 'ZOOT1086' }
    });

    if (!employee) {
      console.log('Employee ZOOT1086 not found. Please run add-sample-employees.js first.');
      return;
    }

    console.log(`Found employee: ${employee.name} (${employee.employeeCode})`);

    // Create break records for the last 3 days
    const today = new Date();
    const breakRecords = [];

    for (let i = 2; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Skip Sundays
      if (date.getDay() === 0) continue;

      // Morning break (10:30 - 10:45)
      const morningBreakIn = new Date(date);
      morningBreakIn.setHours(10, 30, 0);

      const morningBreakOut = new Date(date);
      morningBreakOut.setHours(10, 45, 0);

      const morningDuration = 15;

      breakRecords.push({
        employeeId: employee.id,
        breakDate: date,
        breakInTime: morningBreakIn,
        breakOutTime: morningBreakOut,
        breakDuration: morningDuration,
        isActive: false,
        warningSent: false
      });

      // Afternoon break (15:00 - 15:25) - slightly longer
      const afternoonBreakIn = new Date(date);
      afternoonBreakIn.setHours(15, 0, 0);

      const afternoonBreakOut = new Date(date);
      afternoonBreakOut.setHours(15, 25, 0);

      const afternoonDuration = 25;

      breakRecords.push({
        employeeId: employee.id,
        breakDate: date,
        breakInTime: afternoonBreakIn,
        breakOutTime: afternoonBreakOut,
        breakDuration: afternoonDuration,
        isActive: false,
        warningSent: afternoonDuration > 20 // Warning if over 20 minutes
      });
    }

    // Insert break records
    for (const record of breakRecords) {
      const existing = await prisma.break.findFirst({
        where: {
          employeeId: record.employeeId,
          breakDate: record.breakDate,
          breakInTime: record.breakInTime
        }
      });

      if (existing) {
        console.log(`Break record for ${record.breakDate.toDateString()} at ${record.breakInTime.toTimeString().slice(0, 5)} already exists, skipping...`);
        continue;
      }

      await prisma.break.create({
        data: record
      });

      console.log(`✅ Created break record: ${record.breakDate.toDateString()} ${record.breakInTime.toTimeString().slice(0, 5)} - ${record.breakDuration}min`);
    }

    console.log('Sample break records added successfully!');
  } catch (error) {
    console.error('Error adding sample breaks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleBreaks();