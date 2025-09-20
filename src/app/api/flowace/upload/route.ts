// src/app/api/flowace/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('Flowace upload: Starting upload process');

    await ensureConnection();
    console.log('Flowace upload: Database connected');

    const formData = await request.formData();
    console.log('Flowace upload: Form data received');

    const file = formData.get('file') as File;
    console.log('Flowace upload: File extracted from form data:', file ? file.name : 'No file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a CSV file' },
        { status: 400 }
      );
    }

    // Read file content
    console.log('Flowace upload: Reading file content');
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    console.log('Flowace upload: File has', lines.length, 'lines');

    if (lines.length === 0) {
      console.log('Flowace upload: File is empty');
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    // Generate batch ID
    const batchId = uuidv4();
    console.log('Flowace upload: Generated batch ID:', batchId);

    // Find the actual header row using regex pattern matching
    let headerRowIndex = -1;
    let headers: string[] = [];

    // Look for the row that contains "Member Name" - this is our header row
    const headerPattern = /^Member Name,/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (headerPattern.test(line)) {
        headerRowIndex = i;
        // Use regex to properly split CSV while handling commas in quoted fields
        headers = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        break;
      }
    }

    // If no header found, throw error
    if (headerRowIndex === -1 || headers.length === 0) {
      console.log('Flowace upload: Header row not found');
      return NextResponse.json(
        {
          success: false,
          error: 'Header row with "Member Name" not found in CSV file. Please ensure you are uploading a valid Flowace report.',
          foundLines: lines.slice(0, 10) // Show first 10 lines for debugging
        },
        { status: 400 }
      );
    }

    const dataLines = lines.slice(headerRowIndex + 1).filter(line => line.trim() !== '');
    console.log('Flowace upload: Headers found:', headers);
    console.log('Flowace upload: Header row index:', headerRowIndex);
    console.log('Flowace upload: Data lines count:', dataLines.length);
    console.log('Flowace upload: First few data lines:', dataLines.slice(0, 3));

    // Be very flexible with column requirements - accept any CSV
    console.log('Flowace upload: Found headers:', headers);

    // Only check if we have at least some columns
    if (headers.length === 0) {
      console.log('Flowace upload: No headers found');
      return NextResponse.json(
        {
          success: false,
          error: 'No headers found in CSV file',
          foundColumns: headers
        },
        { status: 400 }
      );
    }

    console.log('Flowace upload: Headers validation passed');

    // Create upload history record
    // TODO: Replace with actual database insertion once flowace_upload_history table is created
    const uploadHistory = {
      id: uuidv4(),
      batchId,
      filename: file.name,
      status: 'PROCESSING',
      totalRecords: dataLines.length,
      processedRecords: 0,
      errorRecords: 0,
      uploadedAt: new Date().toISOString(),
      errors: [] as Array<{ row: number; error: string }>,
      summary: {}
    };

    // Process CSV data
    console.log('Flowace upload: Starting CSV data processing');
    const processedRecords = [];
    const errors = [];
    let processedCount = 0;

    for (let i = 0; i < dataLines.length; i++) { // Process all rows
      const line = dataLines[i];
      console.log(`\n=== Processing row ${i + 1}/${dataLines.length} ===`);
      console.log('Raw line:', line);

      // Proper CSV parsing that handles commas within quoted fields
      const csvRegex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
      const values: string[] = [];
      let match;

      while ((match = csvRegex.exec(line)) !== null) {
        values.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
      }

      console.log('Parsed values:', values.slice(0, 5)); // Show first 5 values
      console.log('Values count:', values.length, 'Expected headers:', headers.length);

      try {
        // Helper function to find column index by exact matching
        const getColumnIndex = (columnName: string) => {
          const index = headers.findIndex(header => header.trim() === columnName);
          return index !== -1 ? index : -1;
        };

        // Parse date using exact column name
        const dateIndex = getColumnIndex('Date');
        const dateStr = dateIndex !== -1 ? values[dateIndex] : '';
        let parsedDate: Date;

        try {
          // Handle DD-MM-YYYY format (like 06-09-2025)
          if (dateStr && dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              // DD-MM-YYYY format
              parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              parsedDate = new Date(dateStr);
            }
          } else {
            parsedDate = new Date(dateStr || new Date().toISOString());
          }

          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date();
          }
        } catch (error) {
          console.error('Date parsing error for:', dateStr, error);
          parsedDate = new Date();
        }

        // Map CSV columns to database record structure using exact column names
        const rawEmployeeCode = values[getColumnIndex('Member Id')] || '';
        const employeeName = values[getColumnIndex('Member Name')] || '';

        // Use employee name if employee code is missing or is just "-"
        const employeeCode = (rawEmployeeCode === '-' || rawEmployeeCode.trim() === '')
          ? employeeName
          : rawEmployeeCode;

        console.log('Employee details:', {
          employeeName,
          rawEmployeeCode,
          generatedEmployeeCode: employeeCode,
          memberEmail: values[getColumnIndex('Member Email')]
        });

        // Log time data for validation
        console.log('Time data validation for', employeeName, ':', {
          loggedHours: values[getColumnIndex('Logged Hours')],
          activeHours: values[getColumnIndex('Active Hours')],
          idleHours: values[getColumnIndex('Idle Hours')],
          missingHours: values[getColumnIndex('Missing Hours')],
          productiveHours: values[getColumnIndex('Productive Hours')],
          unproductiveHours: values[getColumnIndex('Unproductive Hours')],
          availableHours: values[getColumnIndex('Available Hours')],
          workStartTime: values[getColumnIndex('Work Start Time')],
          workEndTime: values[getColumnIndex('Work End Time')],
          activityPercentage: values[getColumnIndex('Activity %')],
          productivityPercentage: values[getColumnIndex('Productivity %')]
        });

        const record = {
          employeeName,
          employeeCode,
          memberEmail: values[getColumnIndex('Member Email')] || null,
          teams: values[getColumnIndex('Teams')] || null,
          date: parsedDate,
          workStartTime: values[getColumnIndex('Work Start Time')] || null,
          workEndTime: values[getColumnIndex('Work End Time')] || null,

          // Time tracking data - preserve decimal precision by using Number() instead of parseFloat()
          loggedHours: Number(values[getColumnIndex('Logged Hours')] || '0') || 0,
          activeHours: Number(values[getColumnIndex('Active Hours')] || '0') || 0,
          idleHours: Number(values[getColumnIndex('Idle Hours')] || '0') || 0,
          classifiedHours: Number(values[getColumnIndex('Classified Hours')] || '0') || 0,
          unclassifiedHours: Number(values[getColumnIndex('Unclassified Hours')] || '0') || 0,

          // Productivity metrics - preserve decimal precision
          productiveHours: Number(values[getColumnIndex('Productive Hours')] || '0') || 0,
          unproductiveHours: Number(values[getColumnIndex('Unproductive Hours')] || '0') || 0,
          neutralHours: Number(values[getColumnIndex('Neutral Hours')] || '0') || 0,
          availableHours: Number(values[getColumnIndex('Available Hours')] || '0') || 0,
          missingHours: Number(values[getColumnIndex('Missing Hours')] || '0') || 0,

          // Percentages (remove % symbol and preserve precision)
          activityPercentage: Number((values[getColumnIndex('Activity %')] || '0').replace('%', '')) || null,
          classifiedPercentage: Number((values[getColumnIndex('Classified %')] || '0').replace('%', '')) || null,
          productivityPercentage: Number((values[getColumnIndex('Productivity %')] || '0').replace('%', '')) || null,

          // Billable duration (convert to minutes)
          classifiedBillableDuration: parseInt(values[getColumnIndex('Classified Billable Duration')] || '0') || 0,
          classifiedNonBillableDuration: parseInt(values[getColumnIndex('Classified Non Billable Duration')] || '0') || 0,

          batchId,
          rawData: values, // Store original CSV row data as JSON
        };

        // Skip empty rows (common at end of CSV files)
        if (values.every(v => !v || v.trim() === '')) {
          console.log('Skipping empty row');
          continue;
        }

        // Basic validation - require employee name
        if (!record.employeeName || record.employeeName.trim() === '') {
          console.log('Missing employee name, adding to errors');
          errors.push({
            row: i + headerRowIndex + 2, // +2 because we start from headerRowIndex and array is 0-indexed
            error: 'Missing employee name'
          });
          continue;
        }

        // TODO: Validate employee exists in database
        // const employee = await prisma.employee.findFirst({
        //   where: { employeeCode: record.employeeCode }
        // });
        // if (!employee) {
        //   errors.push({
        //     row: i + 2,
        //     error: `Employee with code ${record.employeeCode} not found`
        //   });
        //   continue;
        // }

        // Try to find existing employee by code or name
        let employeeId: number | null = null;
        try {
          // Only lookup if we have a valid employee code (not "-" or empty)
          if (record.employeeCode && record.employeeCode !== '-' && record.employeeCode.trim() !== '') {
            const existingEmployee = await prisma.employee.findFirst({
              where: { employeeCode: record.employeeCode }
            });
            employeeId = existingEmployee?.id || null;
          }

          // If not found by code, try by name
          if (!employeeId && record.employeeName) {
            const existingEmployee = await prisma.employee.findFirst({
              where: { name: record.employeeName }
            });
            employeeId = existingEmployee?.id || null;
          }
        } catch (error) {
          console.log('Employee lookup skipped:', error);
        }

        // Save to database - use create instead of upsert for now to avoid constraint issues
        console.log('Saving record to database for:', record.employeeName);
        const dbRecord = await prisma.flowaceRecord.create({
          data: {
            employeeId,
            employeeName: record.employeeName,
            employeeCode: record.employeeCode,
            memberEmail: record.memberEmail,
            teams: record.teams,
            date: record.date,
            workStartTime: record.workStartTime,
            workEndTime: record.workEndTime,
            loggedHours: record.loggedHours,
            activeHours: record.activeHours,
            idleHours: record.idleHours,
            classifiedHours: record.classifiedHours,
            unclassifiedHours: record.unclassifiedHours,
            productiveHours: record.productiveHours,
            unproductiveHours: record.unproductiveHours,
            neutralHours: record.neutralHours,
            availableHours: record.availableHours,
            missingHours: record.missingHours,
            activityPercentage: record.activityPercentage,
            classifiedPercentage: record.classifiedPercentage,
            productivityPercentage: record.productivityPercentage,
            classifiedBillableDuration: record.classifiedBillableDuration,
            classifiedNonBillableDuration: record.classifiedNonBillableDuration,
            batchId: record.batchId,
            rawData: record.rawData,
          }
        });

        console.log('Successfully saved record with ID:', dbRecord.id);
        processedRecords.push(record);
        processedCount++;

      } catch (error) {
        console.error('Error processing row', i + 1, ':', error);
        errors.push({
          row: i + headerRowIndex + 2,
          error: error instanceof Error ? error.message : 'Processing error'
        });
      }
    }

    // Update upload history status
    const finalStatus = errors.length === 0 ? 'COMPLETED' :
                       processedCount > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED';

    uploadHistory.status = finalStatus;
    uploadHistory.processedRecords = processedCount;
    uploadHistory.errorRecords = errors.length;
    uploadHistory.errors = errors;
    uploadHistory.summary = {
      totalRows: dataLines.length,
      successfulRows: processedCount,
      errorRows: errors.length,
      columns: headers
    };

    // Save upload history to database
    await prisma.flowaceUploadHistory.create({
      data: {
        batchId,
        filename: file.name,
        status: finalStatus,
        totalRecords: dataLines.length,
        processedRecords: processedCount,
        errorRecords: errors.length,
        uploadedAt: new Date(),
        completedAt: new Date(),
        errors: errors,
        summary: uploadHistory.summary,
        originalHeaders: headers,
      }
    });

    console.log('Flowace upload: Upload completed successfully');
    console.log('Flowace upload: Final status:', finalStatus);
    console.log('Flowace upload: Processed records:', processedCount);
    console.log('Flowace upload: Errors:', errors.length);

    // Show summary of processed employees
    console.log('\n=== UPLOAD SUMMARY ===');
    console.log('Successfully processed employees:');
    processedRecords.forEach((record, idx) => {
      console.log(`${idx + 1}. ${record.employeeName} (${record.employeeCode})`);
    });

    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach((error, idx) => {
        console.log(`${idx + 1}. Row ${error.row}: ${error.error}`);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Upload ${finalStatus.toLowerCase()}: ${processedCount} records processed, ${errors.length} errors`,
      data: {
        batchId,
        processedRecords: processedCount,
        totalRecords: dataLines.length, // Reflect the actual processed count
        errorRecords: errors.length,
        status: finalStatus,
        errors: errors.slice(0, 10), // Return first 10 errors only
        filename: file.name
      }
    });

  } catch (error) {
    console.error('Error processing flowace upload:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}