
// src/app/page.tsx - Home page
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleLogin = (role: 'employee' | 'admin') => {
    if (!code.trim()) return;
    if (role === 'employee') {
      router.push(`/employee?code=${encodeURIComponent(code.trim())}`);
    } else {
      router.push(`/admin?code=${encodeURIComponent(code.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Access System</h2>
        <p className="text-gray-600 mb-6 text-center">Enter your code to login</p>
        <input
          type="text"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-6 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Enter code (e.g. EMP-001 or ADMIN-001)"
        />
        <Button className="w-full mb-3" onClick={() => handleLogin('employee')}>
          Login as Employee
        </Button>
        <Button variant="outline" className="w-full" onClick={() => handleLogin('admin')}>
          Login as Admin
        </Button>
      </div>
    </div>
  );
}