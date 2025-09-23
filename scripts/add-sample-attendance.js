import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleAttendance() {
  try {
    console.log('Adding sample attendance records...');

    // Get employee with code ZOOT1086
    const employee = await prisma.employee.findUnique({
      where: { employeeCode: 'ZOOT1086' }
    });

    if (!employee) {
      console.log('Employee ZOOT1086 not found. Please run add-sample-employees.js first.');
      return;
    }

    console.log(`Found employee: ${employee.name} (${employee.employeeCode})`);

    // Create attendance records for the last 10 days
    const today = new Date();
    const attendanceRecords = [];

    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip Sundays
      if (date.getDay() === 0) continue;

      const checkInTime = new Date(date);
      checkInTime.setHours(10, Math.floor(Math.random() * 30), 0); // Random check-in between 10:00-10:30

      const checkOutTime = new Date(date);
      checkOutTime.setHours(18, Math.floor(Math.random() * 60), 0); // Random check-out between 18:00-19:00

      const lunchOutTime = new Date(date);
      lunchOutTime.setHours(13, 0, 0); // Lunch break at 13:00

      const lunchInTime = new Date(date);
      lunchInTime.setHours(14, 0, 0); // Return from lunch at 14:00

      // Calculate total hours worked (excluding lunch break)
      const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60) - 1; // Subtract 1 hour for lunch

      const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT']; // Mostly present, occasionally late
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      attendanceRecords.push({
        employeeId: employee.id,
        date: date,
        status: status,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        lunchOutTime: lunchOutTime,
        lunchInTime: lunchInTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        hasTagWork: Math.random() > 0.3, // 70% chance of having tag work
        hasFlowaceWork: Math.random() > 0.5, // 50% chance of having flowace work
        tagWorkMinutes: Math.floor(Math.random() * 240) + 60, // Random between 60-300 minutes
        flowaceMinutes: Math.floor(Math.random() * 300) + 120, // Random between 120-420 minutes
        importSource: 'manual'
      });
    }

    // Insert attendance records
    for (const record of attendanceRecords) {
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          employee_date_attendance: {
            employeeId: record.employeeId,
            date: record.date
          }
        }
      });

      if (existing) {
        console.log(`Attendance record for ${record.date.toDateString()} already exists, skipping...`);
        continue;
      }

      const created = await prisma.attendanceRecord.create({
        data: record
      });

      console.log(`✅ Created attendance record for: ${record.date.toDateString()} - ${record.status}`);
    }

    console.log('Sample attendance records added successfully!');
  } catch (error) {
    console.error('Error adding sample attendance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleAttendance();