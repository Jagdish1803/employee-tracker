// scripts/add-sample-employees.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleEmployees() {
  try {
    console.log('Adding sample employees...');

    // Add sample employees with common codes
    const employees = [
      {
        name: 'Jagdish Kumar',
        email: 'jagdish@company.com',
        employeeCode: 'ZOOT1806',
        department: 'Engineering',
        designation: 'Software Developer',
        role: 'EMPLOYEE'
      },
      {
        name: 'Test Employee',
        email: 'test@company.com',
        employeeCode: 'ZOOT1086',
        department: 'Testing',
        designation: 'QA Engineer',
        role: 'EMPLOYEE'
      },
      {
        name: 'Admin User',
        email: 'admin@company.com',
        employeeCode: 'TIPL1002',
        department: 'Administration',
        designation: 'System Administrator',
        role: 'ADMIN'
      }
    ];

    for (const emp of employees) {
      // Check if employee already exists
      const existing = await prisma.employee.findUnique({
        where: { employeeCode: emp.employeeCode }
      });

      if (existing) {
        console.log(`Employee ${emp.employeeCode} already exists, skipping...`);
        continue;
      }

      const created = await prisma.employee.create({
        data: emp
      });

      console.log(`✅ Created employee: ${created.name} (${created.employeeCode})`);
    }

    console.log('Sample employees added successfully!');
  } catch (error) {
    console.error('Error adding sample employees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleEmployees();