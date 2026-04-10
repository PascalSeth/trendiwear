'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

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
      businessName?: string
    }
  }
  submittedForShowcase: boolean
  isShowcaseApproved: boolean
  submittedAt: string | null
  approvedAt: string | null
  showcaseStatus: "PENDING" | "APPROVED" | "REJECTED"
  _count: {
    wishlistItems: number
    orderItems: number
    reviews: number
  }
  averageRating: number
}

interface ShowcaseDataTableProps {
  products: ShowcaseProduct[]
  onRemove: (productId: string) => void
  loading: boolean
  currentUserId?: string
  userRole?: string
}

export default function ShowcaseDataTable({
  products,
  onRemove,
  loading,
  currentUserId,
  userRole,
}: ShowcaseDataTableProps) {
  const [removing, setRemoving] = useState<string | null>(null)

  const handleRemove = async (productId: string) => {
    setRemoving(productId)
    try {
      const response = await fetch(`/api/showcase-products?productId=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove product from showcase')

      toast.success('Product removed from showcase')
      onRemove(productId)
    } catch {
      toast.error('Failed to remove product from showcase')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Professional</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No products in showcase
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      width={48}
                      height={48}
                    />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product._count.reviews} reviews
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {product.professional.professionalProfile?.businessName ||
                        `${product.professional.firstName} ${product.professional.lastName}`}
                    </span>
                    {product.professional.id === currentUserId && (
                      <Badge variant="secondary" className="bg-stone-100 text-[10px] uppercase tracking-tighter">Owner</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.categories?.[0]?.name || "Uncategorized"}</Badge>
                </TableCell>
                <TableCell>{product.currency} {product.price}</TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div>❤️ {product._count.wishlistItems}</div>
                    <div>🛒 {product._count.orderItems}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        product.showcaseStatus === "APPROVED" 
                          ? "default" 
                          : product.showcaseStatus === "PENDING"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {product.showcaseStatus}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {product.showcaseStatus === "APPROVED" && product.approvedAt
                        ? new Date(product.approvedAt).toLocaleDateString()
                        : product.submittedAt
                        ? new Date(product.submittedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(`/product/${product.id}`, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Product
                      </DropdownMenuItem>
                      {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                        <DropdownMenuItem
                          onClick={() => handleRemove(product.id)}
                          disabled={removing === product.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from Showcase
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}