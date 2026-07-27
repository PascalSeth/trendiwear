'use client';

import React from 'react'
import { ProductTable } from './DataTable'
import { AccessControlWrapper } from '@/app/dashboard/components/AccessControlWrapper'

function ProductsPage() {
  return (
    <AccessControlWrapper requiredPermission="ADD_PRODUCT">
      <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <ProductTable />
      </div>
    </AccessControlWrapper>
  )
}

export default ProductsPage