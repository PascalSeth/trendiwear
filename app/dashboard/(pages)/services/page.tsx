'use client'

import React from 'react'
import ServicesDataTable from './DataTable'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function ServicesPage() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const tabs = [
    { id: 'services', label: 'Services', href: '/dashboard/services' },
    { id: 'categories', label: 'Categories', href: '/dashboard/services/categories' }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
        <p className="text-gray-600 mt-2">Manage services and their categories</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(tab.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isActive('/dashboard/services') && <ServicesDataTable />}
    </div>
  )
}

export default ServicesPage