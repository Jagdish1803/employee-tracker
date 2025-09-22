'use client'

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useEmployeeData } from '@/hooks/useEmployeeData';

export default function DebugPage() {
  const { user, isLoaded } = useUser();
  const { employee, loading: employeeLoading, error: employeeError, employeeId } = useEmployeeData();

  if (!isLoaded) {
    return <div className="p-6">Loading user...</div>;
  }

  if (!user) {
    return <div className="p-6">Not signed in</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Employee Debug Page</h1>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Clerk User Data:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            id: user.id,
            username: user.username,
            emailAddresses: user.emailAddresses?.map(e => e.emailAddress),
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            publicMetadata: user.publicMetadata
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Employee Data Status:</h2>
        <div className="text-sm space-y-1">
          <p><strong>Loading:</strong> {employeeLoading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {employeeError || 'None'}</p>
          <p><strong>Employee ID:</strong> {employeeId || 'Not found'}</p>
        </div>
      </div>

      {employee && (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Found Employee:</h2>
          <pre className="text-sm">
            {JSON.stringify(employee, null, 2)}
          </pre>
        </div>
      )}

      {employeeError && (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Error Details:</h2>
          <p className="text-sm">{employeeError}</p>
        </div>
      )}
    </div>
  );
}