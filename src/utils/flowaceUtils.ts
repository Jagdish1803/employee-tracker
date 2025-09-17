import type { FlowaceRecord } from '@/api/services/flowace.service';

export const exportFlowaceDataToCSV = (dateFilteredRecords: FlowaceRecord[], selectedDate: string) => {
  if (dateFilteredRecords.length === 0) {
    console.warn('No records to export');
    return;
  }

  const formatHoursMinutesSeconds = (hours: number) => {
    if (hours === 0) return '00:00:00';

    const totalMilliseconds = Math.round(hours * 3600 * 1000);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const exportData = dateFilteredRecords.map((record: FlowaceRecord) => ({
    'Employee Name': record.employeeName,
    'Employee Code': record.employeeCode,
    'Date': new Date(record.date).toLocaleDateString(),
    'Total Hours': formatHoursMinutesSeconds(record.totalHours || 0),
    'Logged Hours': formatHoursMinutesSeconds(
      record.loggedHours !== undefined && record.loggedHours !== null
        ? record.loggedHours
        : (record.totalHours || 0)
    ),
    'Active Hours': formatHoursMinutesSeconds(record.activeHours || 0),
    'Idle Hours': formatHoursMinutesSeconds(record.idleHours || 0),
    'Productive Hours': formatHoursMinutesSeconds(record.productiveHours || 0),
    'Unproductive Hours': formatHoursMinutesSeconds(record.unproductiveHours || 0),
    'Productivity %': (record.productivityPercentage || record.productivityScore || 0),
    'Activity %': (record.activityPercentage || record.activityLevel || 0),
    'Classified %': (record.classifiedPercentage || 0),
    'Work Start Time': record.workStartTime || '',
    'Work End Time': record.workEndTime || '',
    'Missing Hours': formatHoursMinutesSeconds(record.missingHours || 0),
    'Status': record.status,
    'Batch ID': record.batchId
  }));

  const csvHeaders = Object.keys(exportData[0] || {});
  const csvContent = [
    csvHeaders.join(','),
    ...exportData.map(row =>
      csvHeaders.map(header => {
        const value = (row as Record<string, unknown>)[header];
        return `"${String(value || '')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const dateRange = selectedDate && selectedDate !== 'all'
    ? `_${selectedDate}`
    : `_${new Date().toISOString().split('T')[0]}`;

  link.download = `flowace-data${dateRange}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const getPerformanceCategory = (record: FlowaceRecord) => {
  const totalHours = record.loggedHours || record.activeHours || record.totalHours || 0;
  const productivityScore = record.productivityPercentage || record.productivityScore || 0;

  if (totalHours < 4) return 'LOW_HOURS';
  if (totalHours >= 8 && productivityScore > 80) return 'EXCELLENT';
  if (totalHours >= 6 && productivityScore > 60) return 'GOOD';
  if (totalHours >= 4 && productivityScore > 40) return 'AVERAGE';
  return 'NEEDS_IMPROVEMENT';
};

export const formatDateForComparison = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};