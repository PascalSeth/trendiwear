'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const totalPros = types.reduce((acc, t) => acc + (t._count?.professionals || 0), 0)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Professional Types</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage professional categories and specializations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
              <Plus className="h-3.5 w-3.5" />
              Add Professional Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-4 sm:p-5 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingType ? 'Edit Professional Type' : 'Create Professional Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-slate-700">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bespoke Tailor"
                  className="h-8 sm:h-9 text-xs rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-medium text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe specialization details..."
                  className="text-xs rounded-lg min-h-[70px] resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <Label htmlFor="isActive" className="text-xs font-medium text-slate-700">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 px-3 text-xs rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 px-3.5 text-xs rounded-lg">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Specializations</span>
            <Users className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{types.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {types.filter(t => t.isActive).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Inactive</span>
            <XCircle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-amber-600">
            {types.filter(t => !t.isActive).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Assigned Pros</span>
            <Users className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-blue-600">
            {totalPros}
          </div>
        </div>
      </div>

      {/* Grid of types */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => (
          <div
            key={type.id}
            className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{type.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={type.isActive ? "default" : "secondary"}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    >
                      {type.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="flex items-center text-xs text-slate-500 font-mono">
                      <Users className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {type._count?.professionals || 0} pros
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(type)}
                    className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {type.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{type.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {types.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center p-6">
          <Users className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No professional types</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            Get started by creating your first professional category or specialization.
          </p>
          <Button onClick={openCreateDialog} size="sm" className="h-8 px-3 text-xs rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Professional Type
          </Button>
        </div>
      )}
    </div>
  )
}