'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ShowcaseProduct {
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
  submittedAt: string
  submittedForShowcase: boolean
  isShowcaseApproved: boolean
  description?: string
}

export default function ShowcaseManagementPage() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingProducts()
  }, [])

  const fetchPendingProducts = async () => {
    try {
      const response = await fetch('/api/products?dashboard=true&showcase=pending')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts((data.products as ShowcaseProduct[]).filter((p) => p.submittedForShowcase && !p.isShowcaseApproved))
    } catch {
      toast.error('Failed to load showcase submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (productId: string, approved: boolean) => {
    setProcessing(productId)
    try {
      const response = await fetch(`/api/products/${productId}/showcase`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      })

      if (!response.ok) throw new Error('Failed to update product')

      toast.success(approved ? 'Product approved for showcase' : 'Product rejected')
      setProducts(products.filter(p => p.id !== productId))
    } catch {
      toast.error('Failed to update product status')
    } finally {
      setProcessing(null)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Showcase Management</h1>
          <p className="text-muted-foreground">
            Review and approve professional product submissions for the showcase
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {products.length} pending
        </Badge>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending submissions</h3>
            <p className="text-muted-foreground text-center">
              All showcase submissions have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <p className="text-muted-foreground mt-1">
                        by {product.professional.professionalProfile?.businessName ||
                            `${product.professional.firstName} ${product.professional.lastName}`}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">{product.category.name}</Badge>
                        <span className="text-lg font-semibold">${product.price}</span>
                        <span className="text-sm text-muted-foreground">
                          Submitted {new Date(product.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/product/${product.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproval(product.id, false)}
                      disabled={processing === product.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproval(product.id, true)}
                      disabled={processing === product.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {product.description && (
                <CardContent>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}