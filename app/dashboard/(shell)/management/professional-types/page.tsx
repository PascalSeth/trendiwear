'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface ProfessionalType {
  id: string
  name: string
  description?: string
  isActive: boolean
  _count: {
    professionals: number
  }
}

export default function ProfessionalTypesManagement() {
  const [types, setTypes] = useState<ProfessionalType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ProfessionalType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/professional-types')
      if (!response.ok) throw new Error('Failed to fetch professional types')
      const data = await response.json()
      setTypes(data)
    } catch {
      toast.error('Failed to load professional types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingType
        ? `/api/professional-types/${editingType.id}`
        : '/api/professional-types'
      const method = editingType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save professional type')

      toast.success(editingType ? 'Professional type updated' : 'Professional type created')
      fetchTypes()
      setDialogOpen(false)
      resetForm()
    } catch {
      toast.error('Failed to save professional type')
    }
  }

  const handleEdit = (type: ProfessionalType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      isActive: type.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this professional type?')) return

    try {
      const response = await fetch(`/api/professional-types/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete professional type')

      toast.success('Professional type deleted')
      fetchTypes()
    } catch {
      toast.error('Failed to delete professional type')
    }
  }

  const resetForm = () => {
    setEditingType(null)
    setFormData({
      name: '',
      description: '',
      isActive: true,
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Professional Types Management</h1>
          <p className="text-muted-foreground">
            Manage professional categories and specializations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Professional Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Professional Type' : 'Create Professional Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => (
          <Card key={type.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      {type._count.professionals} professionals
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {type.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {types.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No professional types</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first professional type
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Professional Type
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}