'use client';

import React from 'react';
import ServicesDataTable from './DataTable';
import { AccessControlWrapper } from '@/app/dashboard/components/AccessControlWrapper';

export default function ServicesPage() {
  return (
    <AccessControlWrapper requiredPermission="ADD_SERVICE">
      <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <ServicesDataTable />
      </div>
    </AccessControlWrapper>
  );
}