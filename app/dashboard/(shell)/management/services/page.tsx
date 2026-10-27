'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Wrench, FolderOpen, Loader2, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface ServiceCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  _count: {
    services: number
  }
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  isHomeService: boolean
  isActive: boolean
  category: {
    name: string
  }
  _count: {
    bookings: number
  }
}

export default function ServicesManagement() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true,
  })
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 60,
    isHomeService: false,
    categoryId: '',
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [categoriesRes, servicesRes] = await Promise.all([
        fetch('/api/service-categories?dashboard=true'),
        fetch('/api/services?dashboard=true&limit=100')
      ])

      const categoriesData = await categoriesRes.json()
      const servicesData = await servicesRes.json()

      setCategories(categoriesData)
      setServices(servicesData.services || [])
    } catch {
      toast.error('Failed to load services data')
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/service-categories/${editingCategory.id}`
        : '/api/service-categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })

      if (!response.ok) throw new Error('Failed to save category')

      toast.success(editingCategory ? 'Category updated' : 'Category created')
      fetchData()
      setCategoryDialogOpen(false)
      resetCategoryForm()
    } catch {
      toast.error('Failed to save category')
    }
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingService
        ? `/api/services/${editingService.id}`
        : '/api/services'
      const method = editingService ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      })

      if (!response.ok) throw new Error('Failed to save service')

      toast.success(editingService ? 'Service updated' : 'Service created')
      fetchData()
      setServiceDialogOpen(false)
      resetServiceForm()
    } catch {
      toast.error('Failed to save service')
    }
  }

  const handleCategoryEdit = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    })
    setCategoryDialogOpen(true)
  }

  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      isHomeService: service.isHomeService,
      categoryId: '',
      isActive: service.isActive,
    })
    setServiceDialogOpen(true)
  }

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/service-categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete category')

      toast.success('Category deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const handleServiceDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete service')

      toast.success('Service deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete service')
    }
  }

  const resetCategoryForm = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      isActive: true,
    })
  }

  const resetServiceForm = () => {
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      duration: 60,
      isHomeService: false,
      categoryId: '',
      isActive: true,
    })
  }

  const openCategoryCreateDialog = () => {
    resetCategoryForm()
    setCategoryDialogOpen(true)
  }

  const openServiceCreateDialog = () => {
    resetServiceForm()
    setServiceDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const totalBookings = services.reduce((acc, s) => acc + (s._count?.bookings || 0), 0)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Services Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage service categories and base services offered by professionals
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Categories</span>
            <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{categories.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Categories</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {categories.filter(c => c.isActive).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Base Services</span>
            <Wrench className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">
            {services.length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Bookings</span>
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-indigo-600">
            {totalBookings}
          </div>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200/70 inline-flex flex-wrap gap-1">
          <TabsTrigger
            value="categories"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Categories ({categories.length})
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Wrench className="h-3.5 w-3.5" />
            Services ({services.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Service Categories</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCategoryCreateDialog} className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-4 sm:p-5 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="category-name" className="text-xs font-medium text-slate-700">Category Name</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g., Alterations & Tailoring"
                      className="h-8 sm:h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category-description" className="text-xs font-medium text-slate-700">Description</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Category scope and details..."
                      className="text-xs rounded-lg min-h-[70px] resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <Label htmlFor="category-active" className="text-xs font-medium text-slate-700">Active Status</Label>
                    <Switch
                      id="category-active"
                      checked={categoryForm.isActive}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCategoryDialogOpen(false)} className="h-8 px-3 text-xs rounded-lg">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-8 px-3.5 text-xs rounded-lg">
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{category.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={category.isActive ? "default" : "secondary"}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-slate-500 font-mono">
                          {category._count?.services || 0} services
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryEdit(category)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryDelete(category.id)}
                        className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{category.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs">
              No service categories found
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Base Services</h2>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openServiceCreateDialog} className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-4 sm:p-5 rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {editingService ? 'Edit Service' : 'Create Service'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="service-name" className="text-xs font-medium text-slate-700">Service Name</Label>
                    <Input
                      id="service-name"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="e.g., Suit Fitting & Adjustment"
                      className="h-8 sm:h-9 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="service-description" className="text-xs font-medium text-slate-700">Description</Label>
                    <Textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Describe the service offerings..."
                      className="text-xs rounded-lg min-h-[70px] resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="service-duration" className="text-xs font-medium text-slate-700">Duration (mins)</Label>
                      <Input
                        id="service-duration"
                        type="number"
                        value={serviceForm.duration}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                        className="h-8 sm:h-9 text-xs rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="service-category" className="text-xs font-medium text-slate-700">Category</Label>
                      <Select
                        value={serviceForm.categoryId}
                        onValueChange={(value) => setServiceForm({ ...serviceForm, categoryId: value })}
                      >
                        <SelectTrigger className="h-8 sm:h-9 text-xs rounded-lg">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.isActive).map((category) => (
                            <SelectItem key={category.id} value={category.id} className="text-xs">
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="service-home"
                        checked={serviceForm.isHomeService}
                        onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isHomeService: checked })}
                      />
                      <Label htmlFor="service-home" className="text-xs text-slate-700">Home Service</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="service-active"
                        checked={serviceForm.isActive}
                        onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isActive: checked })}
                      />
                      <Label htmlFor="service-active" className="text-xs text-slate-700">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setServiceDialogOpen(false)} className="h-8 px-3 text-xs rounded-lg">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-8 px-3.5 text-xs rounded-lg">
                      {editingService ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{service.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                          {service.category.name}
                        </Badge>
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                        <span>{service.duration} min</span>
                        {service.isHomeService && <span className="text-indigo-600 font-sans font-medium">Home visit</span>}
                        <span>{service._count?.bookings || 0} bookings</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleServiceEdit(service)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleServiceDelete(service.id)}
                        className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{service.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs">
              No base services found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}