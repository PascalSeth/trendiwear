'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, X, Eye, Clock, Package, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import ShowcaseDataTable from './ShowcaseDataTable'
import AddToShowcaseDialog from './AddToShowcaseDialog'
import { useSession } from "next-auth/react"
import ShowCase from '@/app/components/ShowCase'
import { Skeleton } from '@/components/ui/skeleton'

interface ShowcaseProduct {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  categories: {
    name: string
  }[]
  professional: {
    id: string
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName: string | null
    }
  }
  submittedAt: string
  submittedForShowcase: boolean
  isShowcaseApproved: boolean
  showcaseStatus: "PENDING" | "APPROVED" | "REJECTED"
  isPreorder?: boolean
  description?: string
}

interface CurrentShowcaseProduct {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  categories: {
    name: string
  }[]
  professional: {
    id: string
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName?: string
    }
  }
  submittedAt: string | null
  approvedAt: string
  submittedForShowcase: boolean
  isShowcaseApproved: boolean
  showcaseStatus: "PENDING" | "APPROVED" | "REJECTED"
  isPreorder?: boolean
  _count: {
    wishlistItems: number
    orderItems: number
    reviews: number
  }
  averageRating: number
}

function ShowcaseItemSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center space-x-4 pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export default function ShowcaseManagementPage() {
  const { data: session } = useSession()
  const [pendingProducts, setPendingProducts] = useState<ShowcaseProduct[]>([])
  const [showcaseProducts, setShowcaseProducts] = useState<CurrentShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showcaseLoading, setShowcaseLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('CUSTOMER')

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/me')
        const data = await response.json()
        const role = data?.user?.role || 'CUSTOMER'
        setUserRole(role)
        
        // Only fetch pending products for admins
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          fetchPendingProducts()
        }
      } catch (error) {
        console.error('Failed to get user role:', error)
        setUserRole('CUSTOMER')
      }
    }

    fetchUserRole()
    fetchShowcaseProducts()
  }, [session])

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
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 text-white shadow-xs">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Showcase Hub</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Featured Showcase Management
            </h1>
            <p className="text-xs text-slate-300">
              Feature popular products, review merchant submissions, and preview the live storefront showcase.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
              <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur text-center min-w-[70px]">
                <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Pending</p>
                <p className="text-base sm:text-lg font-bold">{pendingProducts.length}</p>
              </div>
            )}
            <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur text-center min-w-[70px]">
              <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Live</p>
              <p className="text-base sm:text-lg font-bold">{showcaseProducts.length}</p>
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="current" className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabsTrigger
              value="current"
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <Package className="mr-1.5 h-3.5 w-3.5" />
              Current Showcase
            </TabsTrigger>
            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
              <TabsTrigger
                value="pending"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Pending Requests
                {pendingProducts.length > 0 && (
                  <span className="ml-1.5 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingProducts.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger
              value="live-preview"
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <Monitor className="mr-1.5 h-3.5 w-3.5" />
              Live Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Current Showcase Products</h2>
                <p className="text-xs text-slate-500">
                  Manage products currently featured on the main showcase
                </p>
              </div>
              {['SUPER_ADMIN', 'ADMIN', 'PROFESSIONAL'].includes(userRole) && (
                <AddToShowcaseDialog onAdd={handleAddToShowcase} userRole={userRole} />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
            <ShowcaseDataTable
              products={showcaseProducts}
              onRemove={handleRemoveFromShowcase}
              loading={showcaseLoading}
              userRole={userRole}
              currentUserId={session?.user?.id}
            />
          </div>
        </TabsContent>

        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
          <TabsContent value="pending" className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Pending Showcase Requests</h2>
              <p className="text-xs text-slate-500">
                Review and approve seller product submissions for the showcase
              </p>
              {userRole !== 'SUPER_ADMIN' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-xs">
                    <strong>Note:</strong> Only super administrators can approve showcase requests.
                  </p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid gap-3">
                {[...Array(3)].map((_, i) => (
                  <ShowcaseItemSkeleton key={i} />
                ))}
              </div>
            ) : pendingProducts.length === 0 ? (
              <Card className="rounded-xl border-slate-200/80">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-8 w-8 text-slate-300 mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">No pending submissions</h3>
                  <p className="text-xs text-slate-500 text-center mt-0.5">
                    All showcase submissions have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pendingProducts.map((product) => (
                  <Card key={product.id} className="rounded-xl border-slate-200/80 shadow-xs">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <Image
                            src={product.images[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                            width={56}
                            height={56}
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm font-bold text-slate-900">{product.name}</CardTitle>
                              {product.isPreorder && (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border-blue-200 px-1.5 py-0">Pre-order</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              by {product.professional.professionalProfile?.businessName ||
                                  `${product.professional.firstName} ${product.professional.lastName}`}
                            </p>
                            <div className="flex items-center space-x-2 pt-1 text-xs">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.categories?.[0]?.name || "Uncategorized"}</Badge>
                              <span className="font-bold text-slate-900">{product.currency} {product.price}</span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(product.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {userRole === 'SUPER_ADMIN' && (
                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/product/${product.id}`, '_blank')}
                              className="h-8 text-xs px-2.5 rounded-lg border-slate-200"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(product.id, false)}
                              disabled={processing === product.id}
                              className="h-8 text-xs px-2.5 rounded-lg text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(product.id, true)}
                              disabled={processing === product.id}
                              className="h-8 text-xs px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {product.description && (
                      <CardContent className="px-3 sm:px-4 pb-3 pt-0">
                        <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="live-preview" className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Live Showcase Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live storefront display mode — mirrors the public showcase.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-950 p-2 shadow-sm">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-background/95">
              <div className="pointer-events-none">
                <ShowCase />
              </div>
              <div
                className="absolute inset-0 z-10"
                aria-hidden="true"
                title="Preview mode"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}