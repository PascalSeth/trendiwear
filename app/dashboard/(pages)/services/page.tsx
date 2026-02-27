'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutGrid, List, Clock, DollarSign,
  Home, Store, Calendar, Edit2, Trash2, MoreVertical,
  Sparkles, X, Check, Plus, FolderOpen, Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ServiceSheet, { type Service } from '@/app/dashboard/components/sheet/Service/ServiceSheet'

type ServiceCategory = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    services: number
  }
}

function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('categories')
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'home' | 'instore'>('all')
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [error, setError] = useState('')

  const tabs = [
    { id: 'categories' as const, label: 'Categories', icon: LayoutGrid },
    { id: 'services' as const, label: 'Services', icon: Sparkles }
  ]

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services?page=1&limit=100&dashboard=true')
      if (response.ok) {
        const result = await response.json()
        setServices(result.services || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await fetch('/api/service-categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return

    try {
      const response = await fetch(`/api/services/${service.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete service')
      }
      setServices(prev => prev.filter(s => s.id !== service.id))
    } catch (error) {
      console.error('Error deleting service:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete service')
    }
  }

  const handleToggleStatus = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive })
      })
      if (response.ok) {
        const updated = await response.json()
        setServices(prev => prev.map(s => s.id === service.id ? updated : s))
      }
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  // Category handlers
  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/service-categories/${category.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }
      setCategories(prev => prev.filter(c => c.id !== category.id))
    } catch (error) {
      console.error('Error deleting category:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  const handleToggleCategoryStatus = async (category: ServiceCategory) => {
    try {
      const response = await fetch(`/api/service-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive })
      })
      if (response.ok) {
        const updated = await response.json()
        setCategories(prev => prev.map(c => c.id === category.id ? updated : c))
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && service.isActive) ||
                         (statusFilter === 'inactive' && !service.isActive)
    const matchesType = typeFilter === 'all' ||
                       (typeFilter === 'home' && service.isHomeService) ||
                       (typeFilter === 'instore' && !service.isHomeService)
    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  // Stats
  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    homeServices: services.filter(s => s.isHomeService).length,
    totalBookings: services.reduce((acc, s) => acc + (s._count?.bookings || 0), 0)
  }

  // Category stats
  const categoryStats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    totalServices: categories.reduce((acc, c) => acc + c._count.services, 0)
  }

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(categorySearchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
                Services Management
              </h1>
              <p className="text-slate-600 mt-1">Create and manage your service offerings</p>
            </div>
            {activeTab === 'services' ? (
              <ServiceSheet
                categories={categories}
                onServiceAdded={(newService) => setServices(prev => [newService, ...prev])}
                serviceToEdit={editingService || undefined}
                onServiceUpdated={(updatedService) => {
                  setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s))
                  setEditingService(null)
                }}
                onClose={() => setEditingService(null)}
              />
            ) : (
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 w-fit">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'services' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Services</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Active</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Home Services</p>
                <p className="text-2xl font-bold text-slate-900">{stats.homeServices}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] bg-slate-50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="w-[130px] bg-slate-50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'home' | 'instore')}>
                <SelectTrigger className="w-[140px] bg-slate-50">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="home">Home Service</SelectItem>
                  <SelectItem value="instore">In-Store</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <X size={12} className="cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory('all')} />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {statusFilter}
                  <X size={12} className="cursor-pointer" onClick={() => setStatusFilter('all')} />
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {typeFilter === 'home' ? 'Home Service' : 'In-Store'}
                  <X size={12} className="cursor-pointer" onClick={() => setTypeFilter('all')} />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setStatusFilter('all')
                  setTypeFilter('all')
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Services Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading services...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No services found</h3>
            <p className="text-slate-500 mb-6">
              {services.length === 0 
                ? "Get started by creating your first service."
                : "Try adjusting your filters to find what you're looking for."}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-4xl font-bold text-indigo-600">{service.name[0]}</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className={service.isActive 
                        ? 'bg-emerald-500 hover:bg-emerald-600' 
                        : 'bg-slate-500 hover:bg-slate-600'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {service.isHomeService ? (
                          <><Home size={12} className="mr-1" /> Home</>
                        ) : (
                          <><Store size={12} className="mr-1" /> In-Store</>
                        )}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="w-8 h-8 bg-white/90 backdrop-blur-sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingService(service)}>
                            <Edit2 size={14} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                            {service.isActive ? (
                              <><X size={14} className="mr-2" /> Deactivate</>
                            ) : (
                              <><Check size={14} className="mr-2" /> Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(service)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-indigo-600 font-medium">{service.category?.name}</p>
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{service.description}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="font-semibold">{service.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-500" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-orange-500" />
                        <span>{service._count?.bookings || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 overflow-hidden">
                    {service.imageUrl ? (
                      <Image src={service.imageUrl} alt={service.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">{service.name[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{service.name}</h3>
                      <Badge className={`text-xs ${service.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{service.category?.name}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">${service.price}</p>
                      <p className="text-xs text-slate-400">Price</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">{service.duration}m</p>
                      <p className="text-xs text-slate-400">Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">{service._count?.bookings || 0}</p>
                      <p className="text-xs text-slate-400">Bookings</p>
                    </div>
                  </div>

                  {/* Type */}
                  <Badge variant="outline" className="hidden sm:flex">
                    {service.isHomeService ? <Home size={12} className="mr-1" /> : <Store size={12} className="mr-1" />}
                    {service.isHomeService ? 'Home' : 'Store'}
                  </Badge>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingService(service)}>
                        <Edit2 size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(service)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && filteredServices.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {filteredServices.length} of {services.length} services
          </div>
        )}
          </>
        ) : (
          /* Categories Tab Content */
          <>
            {/* Category Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Total Categories</p>
                    <p className="text-2xl font-bold text-slate-900">{categoryStats.total}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Active</p>
                    <p className="text-2xl font-bold text-slate-900">{categoryStats.active}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Total Services</p>
                    <p className="text-2xl font-bold text-slate-900">{categoryStats.totalServices}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Category Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Categories Grid */}
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-slate-600">Loading categories...</p>
                </div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No categories found</h3>
                <p className="text-slate-500 mb-6">
                  {categories.length === 0
                    ? "Get started by creating your first category."
                    : "Try adjusting your search to find what you're looking for."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-purple-100">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-lg">
                              <ImageIcon className="w-8 h-8 text-indigo-400" />
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                          <Badge className={category.isActive 
                            ? 'bg-emerald-500 hover:bg-emerald-600' 
                            : 'bg-slate-500 hover:bg-slate-600'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Services Count */}
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                            {category._count.services} services
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="secondary" className="w-8 h-8 bg-white/90 backdrop-blur-sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit2 size={14} className="mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleCategoryStatus(category)}>
                                {category.isActive ? (
                                  <><X size={14} className="mr-2" /> Deactivate</>
                                ) : (
                                  <><Check size={14} className="mr-2" /> Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCategory(category)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-semibold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Results count */}
            {!categoriesLoading && filteredCategories.length > 0 && (
              <div className="mt-6 text-center text-sm text-slate-500">
                Showing {filteredCategories.length} of {categories.length} categories
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ServicesPage