'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, Settings, ShoppingBag, Star, Heart, Calendar,
  Package, ChevronRight, Edit2
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  product: {
    id: string
    name: string
    image: string | null
  } | null
  createdAt: string
}

interface Order {
  id: string
  status: string
  createdAt: string
  firstProduct: {
    id: string
    name: string
    images: string[]
  } | null
}

interface CustomerProfile {
  id: string
  firstName: string
  lastName: string
  profileImage: string | null
  memberSince: string
  role: string
  stats: {
    orders: number
    reviews: number
    wishlist: number
  }
  reviews: Review[]
  recentOrders: Order[]
}

interface Props {
  profile: CustomerProfile
  isOwner: boolean
}

export default function CustomerProfileClient({ profile, isOwner }: Props) {
  const displayName = `${profile.firstName} ${profile.lastName}`
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`
  const memberSince = new Date(profile.memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 h-48 relative">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8"
        >
          <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
            <AvatarImage src={profile.profileImage || ''} alt={displayName} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member since {memberSince}</span>
                  </div>
                  {profile.role === 'PROFESSIONAL' && (
                    <Badge className="mt-2 bg-emerald-100 text-emerald-800">
                      Professional Seller
                    </Badge>
                  )}
                </div>
                {isOwner && (
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <ShoppingBag className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.orders}</div>
              <div className="text-sm text-gray-500">Orders</div>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.reviews}</div>
              <div className="text-sm text-gray-500">Reviews</div>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Heart className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <div className="text-2xl font-bold">{profile.stats.wishlist}</div>
              <div className="text-sm text-gray-500">Wishlist</div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reviews */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Recent Reviews
                </CardTitle>
                {profile.reviews.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/u/${profile.id}/reviews`}>
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {profile.reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          {review.product && (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {review.product.image ? (
                                <Image 
                                  src={review.product.image} 
                                  alt={review.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            {review.product && (
                              <p className="text-sm font-medium truncate">{review.product.name}</p>
                            )}
                            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders (Only visible to owner) */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-blue-500" />
                    Recent Orders
                  </CardTitle>
                  {profile.recentOrders.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/orders">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {profile.recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No orders yet</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/shopping">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.recentOrders.map((order) => (
                        <Link 
                          key={order.id} 
                          href={`/orders/${order.id}`}
                          className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {order.firstProduct && (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {order.firstProduct.images?.[0] ? (
                                  <Image 
                                    src={order.firstProduct.images[0]} 
                                    alt={order.firstProduct.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions for Owner */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/settings">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <User className="w-6 h-6" />
                        <span className="text-sm">Edit Profile</span>
                      </Button>
                    </Link>
                    <Link href="/orders">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <ShoppingBag className="w-6 h-6" />
                        <span className="text-sm">My Orders</span>
                      </Button>
                    </Link>
                    <Link href="/wishlist">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <Heart className="w-6 h-6" />
                        <span className="text-sm">Wishlist</span>
                      </Button>
                    </Link>
                    <Link href="/addresses">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                        <Package className="w-6 h-6" />
                        <span className="text-sm">Addresses</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
