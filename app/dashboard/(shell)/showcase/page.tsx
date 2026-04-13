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
    <div className="relative space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(139,92,246,0.28),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">Editorial Dashboard</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Showcase
              <span className="block bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
                Management Studio
              </span>
            </h1>
            <p className="max-w-xl text-sm text-zinc-300 lg:text-base">
              Curate featured products, review submissions, and preview the live storefront experience in one cinematic control room.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-300">Pending</p>
                <p className="mt-1 text-2xl font-semibold">{pendingProducts.length}</p>
              </div>
            )}
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-300">Showcased</p>
              <p className="mt-1 text-2xl font-semibold">{showcaseProducts.length}</p>
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="current" className="space-y-6">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-2 shadow-sm backdrop-blur">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger
              value="current"
              className="rounded-xl border border-transparent bg-zinc-100/80 px-4 py-2.5 text-xs uppercase tracking-wide data-[state=active]:border-zinc-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Package className="mr-2 h-4 w-4" />
              Current Showcase
            </TabsTrigger>
            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
              <TabsTrigger
                value="pending"
                className="rounded-xl border border-transparent bg-zinc-100/80 px-4 py-2.5 text-xs uppercase tracking-wide data-[state=active]:border-zinc-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Clock className="mr-2 h-4 w-4" />
                Pending Requests
              </TabsTrigger>
            )}
            <TabsTrigger
              value="live-preview"
              className="rounded-xl border border-transparent bg-zinc-100/80 px-4 py-2.5 text-xs uppercase tracking-wide data-[state=active]:border-zinc-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Live Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current Showcase Products</h2>
              <p className="text-muted-foreground">
                Manage products currently displayed in the showcase
              </p>
            </div>
            {['SUPER_ADMIN', 'ADMIN', 'PROFESSIONAL'].includes(userRole) && (
              <AddToShowcaseDialog onAdd={handleAddToShowcase} userRole={userRole} />
            )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/95 p-2 shadow-sm">
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
          <TabsContent value="pending" className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
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
            {(['CUSTOMER', 'PROFESSIONAL'].includes(userRole as string)) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>Professional:</strong> Submit your products for showcase approval by setting
                  Submit for Showcase when creating or editing products in the catalogue section.
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
                        <Image
                          src={product.images[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          width={80}
                          height={80}
                        />
                        <div>
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{product.name}</CardTitle>
                            {product.isPreorder && (
                               <Badge variant="outline" className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 border-blue-200">Pre-order</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-1">
                            by {product.professional.professionalProfile?.businessName ||
                                `${product.professional.firstName} ${product.professional.lastName}`}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline">{product.categories?.[0]?.name || "Uncategorized"}</Badge>
                            <span className="text-lg font-semibold">{product.currency} {product.price}</span>
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
        )}

        <TabsContent value="live-preview" className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold tracking-tight">Live Showcase Preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Editorial display mode — this mirrors the public showcase with all interactions disabled.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-zinc-300/70 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-3 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.20),transparent_40%)]" />
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-background/95">
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