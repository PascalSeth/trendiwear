'use client'

import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category: {
    name: string
  }
  professional: {
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName?: string
    }
  }
  isActive: boolean
  isInStock: boolean
  isShowcaseApproved: boolean
}

interface AddToShowcaseDialogProps {
  onAdd: (productId: string) => void
}

export default function AddToShowcaseDialog({ onAdd }: AddToShowcaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        dashboard: 'true',
        limit: '50',
      })
      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      // Filter out products that are already in showcase or inactive
      const availableProducts = data.products.filter(
        (p: Product) => p.isActive && p.isInStock && !p.isShowcaseApproved
      )
      setProducts(availableProducts)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (productId: string) => {
    setAdding(productId)
    try {
      const response = await fetch('/api/showcase-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) throw new Error('Failed to add product to showcase')

      toast.success('Product added to showcase')
      onAdd(productId)
      setOpen(false)
    } catch {
      toast.error('Failed to add product to showcase')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product to Showcase
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Product to Showcase</DialogTitle>
          <DialogDescription>
            Select a product to add to the showcase. Only active, in-stock products not already in showcase are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products available to add to showcase
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.images[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          by {product.professional.professionalProfile?.businessName ||
                              `${product.professional.firstName} ${product.professional.lastName}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{product.category.name}</Badge>
                          <span className="text-sm font-medium">${product.price}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAdd(product.id)}
                      disabled={adding === product.id}
                      size="sm"
                    >
                      {adding === product.id ? 'Adding...' : 'Add to Showcase'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}