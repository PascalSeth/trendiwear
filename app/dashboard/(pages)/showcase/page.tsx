'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, Clock, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import ShowcaseDataTable from './ShowcaseDataTable'
import AddToShowcaseDialog from './AddToShowcaseDialog'
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

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

interface CurrentShowcaseProduct {
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
  approvedAt: string
  _count: {
    wishlistItems: number
    orderItems: number
    reviews: number
  }
  averageRating: number
}

export default function ShowcaseManagementPage() {
  const { user } = useKindeAuth()
  const [pendingProducts, setPendingProducts] = useState<ShowcaseProduct[]>([])
  const [showcaseProducts, setShowcaseProducts] = useState<CurrentShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showcaseLoading, setShowcaseLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('CUSTOMER')

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (user?.id) {
          const response = await fetch('/api/auth/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })
          if (response.ok) {
            const data = await response.json()
            setUserRole(data.role)
          }
        }
      } catch (error) {
        console.error('Failed to get user role:', error)
      }
    }

    fetchUserRole()
    fetchPendingProducts()
    fetchShowcaseProducts()
  }, [user])

  const fetchPendingProducts = async () => {
    try {
      const response = await fetch('/api/products?dashboard=true&showcase=pending')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setPendingProducts((data.products as ShowcaseProduct[]).filter((p) => p.submittedForShowcase && !p.isShowcaseApproved))
    } catch {
      toast.error('Failed to load showcase submissions')
    } finally {
      setLoading(false)
    }
  }

  const fetchShowcaseProducts = async () => {
    try {
      const response = await fetch('/api/showcase-products?dashboard=true')
      if (!response.ok) throw new Error('Failed to fetch showcase products')
      const data = await response.json()
      setShowcaseProducts(data.products)
    } catch {
      toast.error('Failed to load showcase products')
    } finally {
      setShowcaseLoading(false)
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
      setPendingProducts(pendingProducts.filter(p => p.id !== productId))

      if (approved) {
        // Refresh showcase products if approved
        fetchShowcaseProducts()
      }
    } catch {
      toast.error('Failed to update product status')
    } finally {
      setProcessing(null)
    }
  }

  const handleRemoveFromShowcase = (productId: string) => {
    setShowcaseProducts(showcaseProducts.filter(p => p.id !== productId))
  }

  const handleAddToShowcase = () => {
    fetchShowcaseProducts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Showcase Management</h1>
          <p className="text-muted-foreground">
            Manage showcased products and review professional submissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {pendingProducts.length} pending
          </Badge>
          <Badge variant="outline" className="text-sm">
            {showcaseProducts.length} showcased
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Current Showcase</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending Requests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current Showcase Products</h2>
              <p className="text-muted-foreground">
                Manage products currently displayed in the showcase
              </p>
            </div>
            {userRole === 'SUPER_ADMIN' && (
              <AddToShowcaseDialog onAdd={handleAddToShowcase} />
            )}
          </div>

          <ShowcaseDataTable
            products={showcaseProducts}
            onRemove={handleRemoveFromShowcase}
            loading={showcaseLoading}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Pending Showcase Requests</h2>
            <p className="text-muted-foreground">
              Review and approve professional product submissions for the showcase
            </p>
            {userRole !== 'SUPER_ADMIN' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Only super administrators can approve showcase requests.
                  Submit your products for showcase approval through the product management section.
                </p>
              </div>
            )}
            {userRole === 'PROFESSIONAL' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>Professional:</strong> Submit your products for showcase approval by setting
                  "Submit for Showcase" when creating or editing products in the catalogue section.
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : pendingProducts.length === 0 ? (
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
              {pendingProducts.map((product) => (
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
                      {userRole === 'SUPER_ADMIN' && (
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
                      )}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}