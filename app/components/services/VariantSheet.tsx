'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Variant {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  isActive: boolean
}

interface VariantSheetProps {
  isOpen: boolean
  serviceId: string
  serviceName: string
  existingVariants: Variant[]
  onClose: () => void
  onSuccess?: (variants: Variant[]) => void
}

export const VariantSheet: React.FC<VariantSheetProps> = ({
  isOpen,
  serviceId,
  serviceName,
  existingVariants,
  onClose,
  onSuccess,
}) => {
  const [variants, setVariants] = useState<Variant[]>(existingVariants)
  const [newVariant, setNewVariant] = useState({ name: '', description: '', price: '', durationMinutes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    setVariants(existingVariants)
  }, [existingVariants])

  const handleAddVariant = async () => {
    if (!newVariant.name || !newVariant.price || !newVariant.durationMinutes) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/services/${serviceId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVariant.name,
          description: newVariant.description || null,
          price: Number.parseFloat(newVariant.price),
          durationMinutes: Number.parseInt(newVariant.durationMinutes),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add variant')
      }

      const createdVariant = await response.json()
      setVariants([...variants, createdVariant])
      setNewVariant({ name: '', description: '', price: '', durationMinutes: '' })
      onSuccess?.([...variants, createdVariant])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add variant')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    setDeleting(variantId)
    setError('')

    try {
      const response = await fetch(`/api/services/${serviceId}/variants/${variantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete variant')
      }

      setVariants(variants.filter(v => v.id !== variantId))
      onSuccess?.(variants.filter(v => v.id !== variantId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant')
    } finally {
      setDeleting(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, x: '100%' }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Pricing Tiers</h2>
              <p className="text-xs text-stone-500 mt-1">{serviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Existing Variants */}
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-900">Current Variants</h3>
              {variants.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  No variants yet. Add one to offer tiered pricing.
                </p>
              ) : (
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <motion.div
                      key={variant.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-start justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:bg-stone-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 text-sm">{variant.name}</p>
                        {variant.description && (
                          <p className="text-xs text-stone-600 line-clamp-1">
                            {variant.description}
                          </p>
                        )}
                        <p className="text-xs text-stone-500 mt-1">
                          {variant.durationMinutes} min • GHS {variant.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteVariant(variant.id)}
                        disabled={deleting === variant.id}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors ml-3 flex-shrink-0 disabled:opacity-50"
                      >
                        {deleting === variant.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100" />

            {/* Add New Variant */}
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-900">Add New Variant</h3>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">
                  Variant Name *
                </label>
                <Input
                  placeholder="e.g., Full Glam, Day Look, Bridal Package"
                  value={newVariant.name}
                  onChange={e => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Optional description of what's included"
                  value={newVariant.description}
                  onChange={e => setNewVariant(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-2">
                    Price (GHS) *
                  </label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={newVariant.price}
                    onChange={e => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                    className="text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-2">
                    Duration (min) *
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={newVariant.durationMinutes}
                    onChange={e => setNewVariant(prev => ({ ...prev, durationMinutes: e.target.value }))}
                    className="text-sm"
                    min="5"
                    step="5"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAddVariant}
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-stone-100 p-4 bg-stone-50">
            <p className="text-xs text-stone-600">
              💡 Variants let you offer different pricing tiers and durations for the same service. Customers can choose which option suits them best.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
