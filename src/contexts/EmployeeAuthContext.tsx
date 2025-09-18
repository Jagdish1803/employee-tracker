'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { employeeService } from '@/api';
import { Employee } from '@/types';

interface EmployeeAuthContextType {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (employeeCode: string) => Promise<boolean>;
  logout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAuthenticated = !!employee;

  const login = useCallback(async (employeeCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await employeeService.login(employeeCode);

      if (response.data.success && response.data.data) {
        const employeeData = response.data.data;
        setEmployee(employeeData);
        localStorage.setItem('employee_session', JSON.stringify(employeeData));
        toast.success('Login successful');
        return true;
      } else {
        toast.error('Invalid employee code');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid employee code');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if there's a stored session
        const storedEmployee = localStorage.getItem('employee_session');
        if (storedEmployee) {
          setEmployee(JSON.parse(storedEmployee));
        } else {
          // Check for code in URL parameters
          const codeFromUrl = searchParams.get('code');
          if (codeFromUrl) {
            await login(codeFromUrl);
            // Clean up URL
            router.replace('/employee');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('employee_session');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router, searchParams, login]);

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('employee_session');
    router.push('/');
  };

  return (
    <EmployeeAuthContext.Provider
      value={{
        employee,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
}