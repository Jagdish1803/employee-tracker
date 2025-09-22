import { useState, useEffect } from 'react';
import { breakService } from '@/api';

export interface BreakStatus {
  isOnBreak: boolean;
  breakStartTime?: string;
  duration: number;
  isLongBreak: boolean;
}

export function useBreakStatus(employeeId?: number) {
  const [breakStatus, setBreakStatus] = useState<BreakStatus>({
    isOnBreak: false,
    duration: 0,
    isLongBreak: false
  });

  useEffect(() => {
    if (!employeeId) return;

    const checkBreakStatus = async () => {
      try {
        const response = await breakService.getStatus(employeeId);

        if (response && typeof response === 'object') {
          const status = response as Record<string, unknown>;

          if (status.isActive && status.breakInTime) {
            const breakStartTime = new Date(String(status.breakInTime));
            const now = new Date();
            const duration = Math.floor((now.getTime() - breakStartTime.getTime()) / (1000 * 60));

            setBreakStatus({
              isOnBreak: true,
              breakStartTime: String(status.breakInTime),
              duration,
              isLongBreak: duration > 20
            });
          } else {
            setBreakStatus({
              isOnBreak: false,
              duration: 0,
              isLongBreak: false
            });
          }
        } else {
          setBreakStatus({
            isOnBreak: false,
            duration: 0,
            isLongBreak: false
          });
        }
      } catch {
        // Silently handle errors
      }
    };

    // Check immediately
    checkBreakStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBreakStatus, 30000);

    return () => clearInterval(interval);
  }, [employeeId]);

  return breakStatus;
}