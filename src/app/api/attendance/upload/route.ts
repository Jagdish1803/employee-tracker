// src/app/api/attendance/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE_APPROVED', 'WFH_APPROVED', 'LATE', 'HALF_DAY']).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  totalHours: z.string().optional().transform(val => val && val.trim() !== '' ? parseFloat(val) : undefined),
  tagWorkMinutes: z.string().optional().transform(val => val && val.trim() !== '' ? parseInt(val) : 0),
  flowaceMinutes: z.string().optional().transform(val => val && val.trim() !== '' ? parseInt(val) : 0),
  hasException: z.string().optional().transform(val => val?.toLowerCase() === 'true'),
  exceptionType: z.enum(['WORKED_ON_APPROVED_LEAVE', 'NO_WORK_ON_WFH', 'ABSENT_DESPITE_DENIAL', 'WORKED_DESPITE_DENIAL', 'ATTENDANCE_WORK_MISMATCH', 'MISSING_CHECKOUT', 'WORK_WITHOUT_CHECKIN']).optional(),
  exceptionNotes: z.string().optional(),
});

function parseSrpFile(content: string, selectedDate?: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const data = [];
  
  // Find the data section - skip header lines until we find the actual data rows
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for lines that start with a number followed by employee code (case insensitive)
    if (/^\s*\d+\s+[A-Za-z]+\d+/.test(line)) {
      dataStartIndex = i;
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    console.log('No data rows found in SRP file');
    return {
      data: [],
      errors: ['No attendance data found in file'],
      meta: { fields: ['employeeCode', 'date', 'status', 'checkInTime', 'checkOutTime'] }
    };
  }
  
  // Use the selected date from the form, or extract from header as fallback
  let attendanceDate = selectedDate || '';
  
  console.log('SRP Parser - selectedDate parameter:', selectedDate);
  console.log('SRP Parser - initial attendanceDate:', attendanceDate);
  
  if (!attendanceDate) {
    // Extract date from header - look for pattern like "06/09/2025"
    for (const line of lines.slice(0, dataStartIndex)) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        attendanceDate = `${year}-${month}-${day}`;
        break;
      }
    }
  }
  
  if (!attendanceDate) {
    // Fallback to current date if not found
    const today = new Date();
    attendanceDate = today.toISOString().split('T')[0];
  }
  
  console.log('SRP Parser - Final attendanceDate being used:', attendanceDate);
  
  // Validate date format (should be YYYY-MM-DD)
  if (attendanceDate && !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    console.warn('SRP Parser - Date format is not YYYY-MM-DD, received:', attendanceDate);
  }
  
  // Process data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      // Improved parsing approach - split by spaces and identify components
      const normalizedLine = line.replace(/\s+/g, ' ').trim();
      const parts = normalizedLine.split(' ');
      
      if (parts.length < 6) {
        console.log(`Skipping line ${i + 1}: insufficient parts - ${normalizedLine}`);
        continue;
      }
      
      // Find key components by pattern
      const serialNo = parts[0];
      let empCode = '';
      let cardNumber = '';
      const employeeNameParts = [];
      let shift = '';
      let shiftStart = '';
      let timeAndHoursParts = [];
      let status = '';
      
      // Find employee code (letters + numbers like TIPL1002, ZOOT1003)
      let empCodeIndex = -1;
      for (let j = 1; j < parts.length; j++) {
        if (/^[A-Za-z]+\d+$/i.test(parts[j])) {
          empCode = parts[j];
          empCodeIndex = j;
          break;
        }
      }
      
      if (empCodeIndex === -1) {
        console.log(`Skipping line ${i + 1}: employee code not found - ${normalizedLine}`);
        continue;
      }
      
      // Card number follows employee code
      cardNumber = parts[empCodeIndex + 1] || '';
      
      // Find shift (S01, S03, S06, etc.)
      let shiftIndex = -1;
      for (let j = empCodeIndex + 2; j < parts.length; j++) {
        if (/^S\d+$/i.test(parts[j])) {
          shift = parts[j];
          shiftIndex = j;
          break;
        }
      }
      
      if (shiftIndex === -1) {
        console.log(`Skipping line ${i + 1}: shift not found - ${normalizedLine}`);
        continue;
      }
      
      // Employee name is between card number and shift
      for (let j = empCodeIndex + 2; j < shiftIndex; j++) {
        employeeNameParts.push(parts[j]);
      }
      
      // Shift start time follows shift
      shiftStart = parts[shiftIndex + 1] || '';
      
      // Everything after shift start until we find status
      let statusIndex = -1;
      for (let j = shiftIndex + 2; j < parts.length; j++) {
        const part = parts[j].toUpperCase();
        if (/^[PA]$/i.test(part) || part === 'MIS' || part === 'PRESENT' || part === 'ABSENT') {
          status = (part === 'P' || part === 'PRESENT') ? 'PRESENT' : 
                   (part === 'A' || part === 'ABSENT') ? 'ABSENT' : 
                   part === 'MIS' ? 'PRESENT' : '';
          statusIndex = j;
          break;
        }
      }
      
      // Data between shift start and status contains times and hours
      if (statusIndex !== -1) {
        timeAndHoursParts = parts.slice(shiftIndex + 2, statusIndex);
      } else {
        timeAndHoursParts = parts.slice(shiftIndex + 2);
      }
      
      console.log(`Line ${i + 1} - Employee: ${employeeNameParts.join(' ')} - Time/Hours parts: [${timeAndHoursParts.join(', ')}] - Initial Status: ${status}`);
      
      // Extract times and hours from the time/hours parts
      const times = [];
      let hoursWorkedValue = 0;
      
      for (const part of timeAndHoursParts) {
        // Check if it's a time (HH:MM format)
        if (/^\d{2}:\d{2}$/.test(part)) {
          times.push(part);
        }
        // Check if it's hours worked (decimal number like 5.24, 7.35, etc.)
        else if (/^\d+\.\d{2}$/.test(part)) {
          hoursWorkedValue = parseFloat(part);
        }
      }
      
      // Assign times based on how many we found
      const checkIn = times[0] || '';
      let lunchOut = '';
      let lunchIn = '';
      let breakOut = '';
      let breakIn = '';
      let checkOut = '';

      if (times.length === 2) {
        // Simple case: check-in and check-out only
        checkOut = times[1];
      } else if (times.length === 4) {
        // Most common case: check-in, break/lunch out, break/lunch in, check-out
        // Determine if this is lunch or break based on duration
        const outTime = new Date(`2000-01-01T${times[1]}:00`);
        const inTime = new Date(`2000-01-01T${times[2]}:00`);
        const durationMinutes = (inTime.getTime() - outTime.getTime()) / (1000 * 60);

        if (durationMinutes > 45) {
          // Long break (>45 min) - likely lunch
          lunchOut = times[1];
          lunchIn = times[2];
        } else {
          // Short break (<=45 min) - likely coffee/tea break
          breakOut = times[1];
          breakIn = times[2];
        }
        checkOut = times[3];
      } else if (times.length === 3) {
        // Three times: could be check-in, break-out, check-out (no break-in recorded)
        breakOut = times[1];
        checkOut = times[2];
      } else if (times.length === 6) {
        // Six times: check-in, break-out, break-in, lunch-out, lunch-in, check-out
        breakOut = times[1];
        breakIn = times[2];
        lunchOut = times[3];
        lunchIn = times[4];
        checkOut = times[5];
      }
      
      // Smart status detection if not explicitly found
      if (!status) {
        if (hoursWorkedValue > 0 || times.length >= 2) {
          status = 'PRESENT';
        } else if (times.length === 0 && hoursWorkedValue === 0) {
          status = 'ABSENT';
        } else {
          // Has some time data but unclear - default to present
          status = 'PRESENT';
        }
      }
      
      const employeeName = employeeNameParts.join(' ');
      
      console.log(`Processing line ${i + 1}: ${employeeName} - Shift: ${shift} - Hours: ${hoursWorkedValue} - Times: ${times.join(', ')} - Status: ${status}`);
      
      // Map all fields with proper status handling
      const record = {
        serialNo: serialNo.trim(),
        employeeCode: empCode.trim().toUpperCase(),
        cardNumber: cardNumber.trim(),
        employeeName: employeeName.trim(),
        date: attendanceDate,
        status: status === 'PRESENT' ? 'PRESENT' : status === 'ABSENT' ? 'ABSENT' : status === 'P' ? 'PRESENT' : status === 'A' ? 'ABSENT' : status === 'MIS' ? 'PRESENT' : 'ABSENT',
        checkInTime: checkIn.trim() || '',
        lunchOutTime: lunchOut.trim() || '',
        lunchInTime: lunchIn.trim() || '',
        breakOutTime: breakOut.trim() || '',
        breakInTime: breakIn.trim() || '',
        checkOutTime: checkOut.trim() || '',
        hoursWorked: hoursWorkedValue.toString(),
        shift: shift.trim(),
        shiftStart: shiftStart.trim()
      };
      data.push(record);
    } catch (error) {
      console.error('Error parsing SRP line:', line, error);
    }
  }
  
  console.log(`Parsed ${data.length} records from SRP file`);
  
  return {
    data,
    errors: [],
    meta: { 
      fields: ['employeeCode', 'employeeName', 'date', 'status', 'checkInTime', 'checkOutTime', 'hoursWorked'],
      attendanceDate 
    }
  };
}

function validateDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

function validateTime(timeString: string, dateString: string): Date | null {
  if (!timeString) return null;
  
  const date = new Date(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const selectedDate = formData.get('uploadDate') as string; // Get the selected date from form (matches the frontend field name)
    
    console.log('Upload API - Received selectedDate:', selectedDate);

    if (!file) {
      console.error('No file found in form data');
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.srp')) {
      console.error('Invalid file type:', file.name);
      return NextResponse.json(
        { success: false, error: 'File must be a CSV or SRP file' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();

    console.log('Starting file upload process...');

    // Create upload history record at the start
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Creating upload history with batchId:', batchId);
    
    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        filename: file.name,
        status: 'PROCESSING',
        batchId,
        totalRecords: 0,
        processedRecords: 0,
        errorRecords: 0,
      }
    });

    console.log('Created upload history record with ID:', uploadHistory.id);

    let parseResult;
    
    // Handle SRP files differently from CSV files
    if (file.name.endsWith('.srp')) {
      parseResult = parseSrpFile(fileContent, selectedDate);
    } else {
      // Parse CSV - Keep all values as strings to preserve formatting
      parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep all values as strings
        transform: (value: string) => {
          // Preserve original string values without automatic type conversion
          return value;
        }
      });
    }


    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'CSV parsing failed',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Check if CSV has required headers
    const requiredHeaders = ['employeeCode', 'date', 'status'];
    const headers = parseResult.meta?.fields || [];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      console.error('Missing required headers:', missingHeaders);
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required CSV headers',
          details: { missingHeaders, foundHeaders: headers },
        },
        { status: 400 }
      );
    }

    await prisma.$connect();

    // Create import log
    const importLog = await prisma.importLog.create({
      data: {
        fileName: file.name,
        fileType: 'ATTENDANCE_CSV',
        status: 'PROCESSING',
        totalRecords: parseResult.data.length,
        batchId,
        uploadedBy: 1, // You might want to get this from session
      },
    });

    const results = {
      processed: 0,
      errors: [] as unknown[],
      warnings: [] as unknown[],
    };

    // Get all employees for code lookup
    const employees = await prisma.employee.findMany({
      select: { id: true, employeeCode: true, name: true },
    });
    const employeeMap = new Map(employees.map(emp => [emp.employeeCode, emp]));

    // Process each row with batch processing for better performance
    const attendanceRecords = [];
    const newEmployees = [];
    
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, unknown>;
      const rowNumber = i + 1;

      try {
        console.log('Processing row:', rowNumber, row);

        // For SRP files, we have a different structure
        if (file.name.endsWith('.srp')) {
          // Find or create employee
          let employee = employeeMap.get(String(row.employeeCode));
          if (!employee) {
            // Prepare new employee for batch creation
            const newEmployee = {
              employeeCode: String(row.employeeCode),
              name: String(row.employeeName || row.employeeCode),
              email: `${String(row.employeeCode).toLowerCase()}@company.com`,
              department: 'General',
              designation: 'Employee',
              isActive: true
            };
            newEmployees.push(newEmployee);
            
            // Temporarily add to map for processing
            employee = {
              id: -newEmployees.length, // Temporary ID
              employeeCode: String(row.employeeCode),
              name: String(row.employeeName || row.employeeCode)
            };
            employeeMap.set(String(row.employeeCode), employee);
          }

          // Validate and parse date
          const date = validateDate(String(row.date));
          if (!date) {
            results.errors.push({
              row: rowNumber,
              error: `Invalid date format: ${row.date}`,
              data: row,
            });
            continue;
          }

          // Parse times if provided
          const checkInTime = row.checkInTime ?
            validateTime(String(row.checkInTime), String(row.date)) : null;
          const checkOutTime = row.checkOutTime ?
            validateTime(String(row.checkOutTime), String(row.date)) : null;

          // Calculate hours worked
          let hoursWorked = 0;
          if (row.hoursWorked && !isNaN(parseFloat(String(row.hoursWorked)))) {
            hoursWorked = parseFloat(String(row.hoursWorked));
          } else if (checkInTime && checkOutTime) {
            hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          }

          // Determine final attendance status with improved smart defaults
          let attendanceStatus = String(row.status);

          // If status is clear, use it
          if (['PRESENT', 'ABSENT', 'LEAVE_APPROVED', 'WFH_APPROVED', 'LATE', 'HALF_DAY'].includes(attendanceStatus)) {
            // Status is already correct
          } else {
            // Apply smart logic based on available data
            const hasWorkEvidence = hoursWorked > 0;
            const hasTimeEvidence = checkInTime && checkOutTime;
            const hasPartialTimeEvidence = checkInTime || checkOutTime;

            if (hasWorkEvidence || hasTimeEvidence) {
              // Clear evidence of work - mark as present
              attendanceStatus = 'PRESENT';
            } else if (hasPartialTimeEvidence) {
              // Partial time data - likely present but might be late or early leave
              attendanceStatus = hoursWorked < 4 ? 'HALF_DAY' : 'PRESENT';
            } else {
              // No evidence of work or time - mark as absent
              attendanceStatus = 'ABSENT';
            }

            console.log(`Smart status assignment for ${row.employeeName}: ${attendanceStatus} (Hours: ${hoursWorked}, CheckIn: ${checkInTime ? 'Yes' : 'No'}, CheckOut: ${checkOutTime ? 'Yes' : 'No'})`);
          }

          // Prepare attendance record for batch processing
          attendanceRecords.push({
            employeeCode: String(row.employeeCode),
            attendanceDate: date,
            status: attendanceStatus,
            checkInTime,
            checkOutTime,
            lunchOutTime: row.lunchOutTime ?
              validateTime(String(row.lunchOutTime), String(row.date)) : null,
            lunchInTime: row.lunchInTime ?
              validateTime(String(row.lunchInTime), String(row.date)) : null,
            breakOutTime: row.breakOutTime ?
              validateTime(String(row.breakOutTime), String(row.date)) : null,
            breakInTime: row.breakInTime ?
              validateTime(String(row.breakInTime), String(row.date)) : null,
            hoursWorked,
            shift: row.shift || '',
            shiftStart: row.shiftStart || '',
            remarks: `Shift: ${row.shift || 'N/A'}, Start: ${row.shiftStart || 'N/A'}`,
            source: 'SRP_FILE' as const,
            rowNumber
          });

          continue;
        }

        // Original CSV processing logic with proper validation
        const validatedRow = csvRowSchema.parse(row);

        // Find employee
        const employee = employeeMap.get(validatedRow.employeeCode);
        if (!employee) {
          results.errors.push({
            row: rowNumber,
            error: `Employee not found with code: ${validatedRow.employeeCode}`,
            data: row,
          });
          continue;
        }

        // Validate and parse date
        const date = validateDate(validatedRow.date);
        if (!date) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid date format: ${validatedRow.date}`,
            data: row,
          });
          continue;
        }

        // Parse times if provided
        const checkInTime = validatedRow.checkInTime ? 
          validateTime(validatedRow.checkInTime, validatedRow.date) : null;
        const checkOutTime = validatedRow.checkOutTime ? 
          validateTime(validatedRow.checkOutTime, validatedRow.date) : null;

        // Calculate work evidence flags
        const hasTagWork = validatedRow.tagWorkMinutes > 0;
        const hasFlowaceWork = validatedRow.flowaceMinutes > 0;

        // Determine attendance status with improved smart defaults
        let attendanceStatus = validatedRow.status;
        if (!attendanceStatus) {
          // Apply enhanced smart logic based on available evidence
          const hasWorkHours = validatedRow.totalHours && validatedRow.totalHours > 0;
          const hasTimeEvidence = checkInTime && checkOutTime;
          const hasPartialTimeEvidence = checkInTime || checkOutTime;
          const hasTagWork = validatedRow.tagWorkMinutes > 0;
          const hasFlowaceWork = validatedRow.flowaceMinutes > 0;
          const hasWorkEvidence = hasTagWork || hasFlowaceWork;

          if (hasWorkHours || hasTimeEvidence || hasWorkEvidence) {
            // Clear evidence of work - mark as present
            attendanceStatus = 'PRESENT';
          } else if (hasPartialTimeEvidence) {
            // Partial time data but no work hours - could be late or half day
            attendanceStatus = 'LATE';
          } else {
            // No evidence of work or time - mark as absent
            attendanceStatus = 'ABSENT';
          }

          console.log(`CSV Smart status assignment for ${employee.name}: ${attendanceStatus} (WorkHours: ${hasWorkHours}, Time: ${hasTimeEvidence}, Tag: ${hasTagWork}, Flowace: ${hasFlowaceWork})`);
        }

        // Create/update attendance record for CSV
        await prisma.attendanceRecord.upsert({
          where: {
            employee_date_attendance: {
              employeeId: employee.id,
              date: date,
            },
          },
          update: {
            status: attendanceStatus,
            checkInTime,
            checkOutTime,
            totalHours: validatedRow.totalHours,
            hasTagWork,
            hasFlowaceWork,
            tagWorkMinutes: validatedRow.tagWorkMinutes || 0,
            flowaceMinutes: validatedRow.flowaceMinutes || 0,
            hasException: validatedRow.hasException || false,
            exceptionType: validatedRow.exceptionType || null,
            exceptionNotes: validatedRow.exceptionNotes || null,
            importSource: 'csv',
            importBatch: batchId,
          },
          create: {
            employeeId: employee.id,
            date,
            status: attendanceStatus,
            checkInTime,
            checkOutTime,
            totalHours: validatedRow.totalHours,
            hasTagWork,
            hasFlowaceWork,
            tagWorkMinutes: validatedRow.tagWorkMinutes || 0,
            flowaceMinutes: validatedRow.flowaceMinutes || 0,
            hasException: validatedRow.hasException || false,
            exceptionType: validatedRow.exceptionType || null,
            exceptionNotes: validatedRow.exceptionNotes || null,
            importSource: 'csv',
            importBatch: batchId,
          },
        });

        results.processed++;

        // Check for potential warnings
        if (validatedRow.status === 'PRESENT' && !checkInTime && !checkOutTime) {
          results.warnings.push({
            row: rowNumber,
            warning: 'Employee marked present but no check-in/out times provided',
            employee: employee.name,
          });
        }

        if (validatedRow.hasException && !validatedRow.exceptionNotes) {
          results.warnings.push({
            row: rowNumber,
            warning: 'Exception marked but no notes provided',
            employee: employee.name,
          });
        }

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        console.error('Row data that caused error:', row);
        
        let errorMessage = 'Unknown validation error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        }
        
        results.errors.push({
          row: rowNumber,
          error: errorMessage,
          data: row,
        });
      }
    }

    // Batch create new employees if any
    if (newEmployees.length > 0) {
      console.log(`Creating ${newEmployees.length} new employees in batch...`);
      await prisma.employee.createMany({
        data: newEmployees,
        skipDuplicates: true
      });
      
      // Update employee map with real IDs
      const freshEmployees = await prisma.employee.findMany({
        where: {
          employeeCode: {
            in: newEmployees.map(emp => emp.employeeCode)
          }
        }
      });
      
      for (const emp of freshEmployees) {
        employeeMap.set(emp.employeeCode, emp);
      }
    }

    // Optimized batch process attendance records for SRP files
    if (file.name.endsWith('.srp') && attendanceRecords.length > 0) {
      console.log(`Processing ${attendanceRecords.length} attendance records in optimized batches...`);

      // Increased batch size for better performance
      const optimizedBatchSize = 500;

      for (let i = 0; i < attendanceRecords.length; i += optimizedBatchSize) {
        const batch = attendanceRecords.slice(i, i + optimizedBatchSize);

        try {
          // Use a single transaction for each batch for better performance
          await prisma.$transaction(async (tx) => {
            const batchPromises = batch.map(async (record) => {
              const employee = employeeMap.get(record.employeeCode);
              if (!employee) {
                results.errors.push({
                  row: record.rowNumber,
                  error: `Employee not found with code: ${record.employeeCode}`,
                  data: record,
                });
                return;
              }

              try {
                await tx.attendanceRecord.upsert({
                  where: {
                    employee_date_attendance: {
                      employeeId: employee.id,
                      date: record.attendanceDate,
                    }
                  },
                  update: {
                    status: record.status as 'PRESENT' | 'ABSENT' | 'LEAVE_APPROVED' | 'WFH_APPROVED' | 'LATE' | 'HALF_DAY',
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime,
                    lunchOutTime: record.lunchOutTime,
                    lunchInTime: record.lunchInTime,
                    breakOutTime: record.breakOutTime,
                    breakInTime: record.breakInTime,
                    totalHours: record.hoursWorked,
                    shift: record.shift ? String(record.shift) : null,
                    shiftStart: record.shiftStart ? String(record.shiftStart) : null,
                    exceptionNotes: record.remarks ? String(record.remarks) : null,
                    importSource: 'SRP_FILE',
                    importBatch: batchId
                  },
                  create: {
                    employeeId: employee.id,
                    date: record.attendanceDate,
                    status: record.status as 'PRESENT' | 'ABSENT' | 'LEAVE_APPROVED' | 'WFH_APPROVED' | 'LATE' | 'HALF_DAY',
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime,
                    lunchOutTime: record.lunchOutTime,
                    lunchInTime: record.lunchInTime,
                    breakOutTime: record.breakOutTime,
                    breakInTime: record.breakInTime,
                    totalHours: record.hoursWorked,
                    shift: record.shift ? String(record.shift) : null,
                    shiftStart: record.shiftStart ? String(record.shiftStart) : null,
                    exceptionNotes: record.remarks ? String(record.remarks) : null,
                    importSource: 'SRP_FILE',
                    importBatch: batchId
                  }
                });

                results.processed++;
              } catch (recordError) {
                console.error(`Error processing record for employee ${employee.employeeCode}:`, recordError);
                results.errors.push({
                  row: record.rowNumber,
                  error: `Database error: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`,
                  data: record,
                });
              }
            });

            // Wait for all records in this batch to complete
            await Promise.all(batchPromises);
          }, {
            maxWait: 30000, // 30 seconds max wait
            timeout: 60000, // 60 seconds timeout
          });

          // Update progress
          const batchNumber = Math.floor(i / optimizedBatchSize) + 1;
          const totalBatches = Math.ceil(attendanceRecords.length / optimizedBatchSize);
          console.log(`Completed batch ${batchNumber}/${totalBatches} (${results.processed} records processed)`);

        } catch (error) {
          console.error(`Error processing batch starting at index ${i}:`, error);

          // Add errors for failed batch
          const failedBatch = batch.slice(0, Math.min(optimizedBatchSize, attendanceRecords.length - i));
          failedBatch.forEach(record => {
            results.errors.push({
              row: record.rowNumber,
              error: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              data: record,
            });
          });
        }
      }
    }

    // Update import log
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: results.errors.length === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED',
        processedRecords: results.processed,
        errorRecords: results.errors.length,
        errors: JSON.parse(JSON.stringify(results.errors)),
        summary: {
          totalRows: parseResult.data.length,
          processed: results.processed,
          errors: results.errors.length,
          warnings: results.warnings.length,
        },
        completedAt: new Date(),
      },
    });

    // Update upload history at the end with final results
    console.log('Updating upload history with final results...');
    console.log('Final stats - Total:', parseResult.data.length, 'Processed:', results.processed, 'Errors:', results.errors.length);
    
    await prisma.uploadHistory.update({
      where: { id: uploadHistory.id },
      data: {
        status: results.errors.length > 0 ? (results.processed > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED') : 'COMPLETED',
        totalRecords: parseResult.data.length,
        processedRecords: results.processed,
        errorRecords: results.errors.length,
        completedAt: new Date(),
        errors: results.errors.length > 0 ? JSON.parse(JSON.stringify(results.errors)) : undefined,
        summary: {
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          successRate: parseResult.data.length > 0 ? (results.processed / parseResult.data.length * 100).toFixed(2) + '%' : '0%'
        }
      }
    });

    console.log('Upload history updated successfully');

    return NextResponse.json({
      success: true,
      data: {
        importId: importLog.id,
        batchId,
        totalRecords: parseResult.data.length,
        processedRecords: results.processed,
        errorRecords: results.errors.length,
        warningsCount: results.warnings.length,
        errors: JSON.parse(JSON.stringify(results.errors)),
        warnings: results.warnings,
      },
      message: `Successfully processed ${results.processed} out of ${parseResult.data.length} records`,
    });

  } catch (error) {
    console.error('Error processing attendance CSV:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    let errorMessage = 'Failed to process attendance CSV';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if it's a validation error (usually 400)
      if (error.message.includes('validation') || error.message.includes('required')) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: statusCode }
    );
  }
}