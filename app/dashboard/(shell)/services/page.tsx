'use client';

import React from 'react';
import ServicesDataTable from './DataTable';
import { AccessControlWrapper } from '@/app/dashboard/components/AccessControlWrapper';

export default function ServicesPage() {
  return (
    <AccessControlWrapper requiredPermission="ADD_SERVICE">
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5">
        <ServicesDataTable />
      </div>
    </AccessControlWrapper>
  );
}