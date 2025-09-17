// Admin authentication utilities

export interface AdminSession {
  isAuthenticated: boolean;
  code: string;
  loginTime: number;
}

export const ADMIN_SESSION_KEY = 'admin';

export function saveAdminSession(code: string): void {
  const session: AdminSession = {
    isAuthenticated: true,
    code,
    loginTime: Date.now(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  try {
    const saved = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!saved) return null;
    
    const session = JSON.parse(saved) as AdminSession;
    
    // Check if session is still valid (24 hours)
    const sessionAge = Date.now() - session.loginTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      clearAdminSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing admin session:', error);
    clearAdminSession();
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isValidAdminCode(code: string): boolean {
  return !!(code && code.startsWith('ADMIN-'));
}