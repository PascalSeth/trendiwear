'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Wrench, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      categoryId: '', // Would need to get from service data
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
          <p className="text-muted-foreground">
            Manage service categories and base services offered by professionals
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Services ({services.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Service Categories</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCategoryCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={categoryForm.isActive}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                    />
                    <Label htmlFor="category-active">Active</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {category._count.services} services
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleCategoryEdit(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Base Services</h2>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openServiceCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Create Service'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="service-name">Name</Label>
                    <Input
                      id="service-name"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-description">Description</Label>
                    <Textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-duration">Duration (minutes)</Label>
                      <Input
                        id="service-duration"
                        type="number"
                        value={serviceForm.duration}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-category">Category</Label>
                      <Select
                        value={serviceForm.categoryId}
                        onValueChange={(value) => setServiceForm({ ...serviceForm, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.isActive).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="service-home"
                        checked={serviceForm.isHomeService}
                        onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isHomeService: checked })}
                      />
                      <Label htmlFor="service-home">Home Service</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="service-active"
                        checked={serviceForm.isActive}
                        onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isActive: checked })}
                      />
                      <Label htmlFor="service-active">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingService ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{service.category.name}</Badge>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{service.duration} min</span>
                        {service.isHomeService && <span>Home service</span>}
                        <span>{service._count.bookings} bookings</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleServiceEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleServiceDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {service.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}