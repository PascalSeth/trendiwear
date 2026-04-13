'use client'

import { useState, useEffect } from 'react'
import { Eye, Trash2, AlertTriangle, FileText, Star, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface Blog {
  id: string
  title: string
  author: {
    firstName: string
    lastName: string
  }
  isPublished: boolean
  createdAt: string
  viewCount: number
}

interface Review {
  id: string
  user: {
    firstName: string
    lastName: string
  }
  targetType: string
  rating: number
  comment?: string
  createdAt: string
}

interface ReportedContent {
  id: string
  reporter: {
    firstName: string
    lastName: string
  }
  contentType: string
  reason: string
  status: string
  createdAt: string
}

export default function ContentModeration() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reports, setReports] = useState<ReportedContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContentData()
  }, [])

  const fetchContentData = async () => {
    try {
      setLoading(true)

      // Fetch blogs
      const blogsRes = await fetch('/api/blogs?dashboard=true')
      const blogsData = await blogsRes.json()
      setBlogs(blogsData.blogs || [])

      // Fetch reviews
      const reviewsRes = await fetch('/api/reviews?limit=50')
      const reviewsData = await reviewsRes.json()
      setReviews(reviewsData.reviews || [])

      // Fetch reported content
      const reportsRes = await fetch('/api/reported-content')
      const reportsData = await reportsRes.json()
      setReports(reportsData.reports || [])

    } catch {
      toast.error('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  const handleBlogAction = async (blogId: string, action: 'publish' | 'unpublish' | 'delete') => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: action === 'publish' })
      })

      if (!response.ok) throw new Error('Failed to update blog')

      toast.success(`Blog ${action}d successfully`)
      fetchContentData()
    } catch {
      toast.error('Failed to update blog')
    }
  }

  const handleReviewAction = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete review')

      toast.success('Review deleted successfully')
      fetchContentData()
    } catch {
      toast.error('Failed to delete review')
    }
  }

  const handleReportAction = async (reportId: string, action: 'resolve' | 'reject') => {
    try {
      const response = await fetch(`/api/reported-content/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'resolve' ? 'RESOLVED' : 'REJECTED' })
      })

      if (!response.ok) throw new Error('Failed to update report')

      toast.success(`Report ${action}d successfully`)
      fetchContentData()
    } catch {
      toast.error('Failed to update report')
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
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">
            Monitor and moderate user-generated content across the platform
          </p>
        </div>
      </div>

      <Tabs defaultValue="blogs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blogs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blogs ({blogs.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="space-y-4">
          <div className="grid gap-4">
            {blogs.map((blog) => (
              <Card key={blog.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{blog.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {blog.author.firstName} {blog.author.lastName} • {blog.viewCount} views
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={blog.isPublished ? "default" : "secondary"}>
                        {blog.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlogAction(blog.id, blog.isPublished ? 'unpublish' : 'publish')}
                      >
                        {blog.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlogAction(blog.id, 'delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {review.user.firstName} {review.user.lastName}
                        </span>
                        <Badge variant="outline">{review.targetType}</Badge>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewAction(review.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">
                          Reported by {report.reporter.firstName} {report.reporter.lastName}
                        </span>
                        <Badge variant="outline">{report.contentType}</Badge>
                        <Badge variant={
                          report.status === 'PENDING' ? 'destructive' :
                          report.status === 'RESOLVED' ? 'default' : 'secondary'
                        }>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {report.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}