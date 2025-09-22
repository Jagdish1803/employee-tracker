// src/hooks/useEmployeeData.ts
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { employeeService } from '@/api';
import { Employee } from '@/types';

export function useEmployeeData() {
  const { user } = useUser();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract employee code from various possible sources
        let employeeCode: string | null = null;

        // Check if username is the employee code
        if (user.username) {
          employeeCode = user.username.toUpperCase();
        }
        // Check if email contains the employee code (e.g., ZOOT1806@company.com)
        else if (user.emailAddresses?.[0]?.emailAddress) {
          const email = user.emailAddresses[0].emailAddress;
          const emailPrefix = email.split('@')[0];
          // Check if email prefix looks like an employee code (alphanumeric)
          if (/^[A-Z0-9]+$/i.test(emailPrefix)) {
            employeeCode = emailPrefix.toUpperCase();
          }
        }
        // Check if firstName or lastName contains the employee code
        else if (user.firstName && /^[A-Z0-9]+$/i.test(user.firstName)) {
          employeeCode = user.firstName.toUpperCase();
        }

        if (!employeeCode) {
          setError('No valid employee code found in user profile');
          setLoading(false);
          return;
        }

        const response = await employeeService.getByCode(employeeCode);

        if (response.data.success && response.data.data) {
          // Map API response to Employee type
          const apiEmployee = response.data.data as unknown as {
            id: number;
            name: string;
            email: string;
            employeeCode: string;
            department?: string;
            designation?: string;
            role: string;
            createdAt: string;
          };
          const employee: Employee = {
            id: apiEmployee.id,
            name: apiEmployee.name,
            email: apiEmployee.email,
            employeeCode: apiEmployee.employeeCode,
            department: apiEmployee.department,
            position: apiEmployee.designation,
            role: apiEmployee.role as 'ADMIN' | 'EMPLOYEE',
            createdAt: new Date(apiEmployee.createdAt)
          };
          setEmployee(employee);
        } else {
          setError(`Employee not found for code: ${employeeCode}`);
        }
      } catch (err) {
        setError('Failed to fetch employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [user]);

  return {
    employee,
    loading,
    error,
    employeeId: employee?.id || null,
    employeeCode: employee?.employeeCode || null,
  };
}