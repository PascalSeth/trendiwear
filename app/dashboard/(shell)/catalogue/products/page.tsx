'use client';

import React from 'react'
import { ProductTable } from './DataTable'
import { AccessControlWrapper } from '@/app/dashboard/components/AccessControlWrapper'

function ProductsPage() {
  return (
    <AccessControlWrapper requiredPermission="ADD_PRODUCT">
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-5">
        <ProductTable />
      </div>
    </AccessControlWrapper>
  )
}

export default ProductsPage