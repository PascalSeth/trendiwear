'use client'

import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, FileText, Star, Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Content Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and moderate user-generated content across the platform
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Blogs</span>
            <FileText className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{blogs.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Published</span>
            <FileText className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {blogs.filter(b => b.isPublished).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Reviews</span>
            <Star className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">
            {reviews.length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Pending Reports</span>
            <Flag className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-rose-600">
            {reports.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="blogs" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200/70 inline-flex flex-wrap gap-1">
          <TabsTrigger
            value="blogs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Blogs ({blogs.length})
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Star className="h-3.5 w-3.5" />
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Flag className="h-3.5 w-3.5" />
            Reports ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="space-y-3">
          <div className="space-y-2.5">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight truncate max-w-md">
                      {blog.title}
                    </h3>
                    <Badge
                      variant={blog.isPublished ? "default" : "secondary"}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    >
                      {blog.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    by {blog.author.firstName} {blog.author.lastName} • {blog.viewCount.toLocaleString()} views • {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlogAction(blog.id, blog.isPublished ? 'unpublish' : 'publish')}
                    className="h-8 px-2.5 text-xs rounded-lg font-medium"
                  >
                    {blog.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBlogAction(blog.id, 'delete')}
                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {blogs.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs">
                No blogs found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3">
          <div className="space-y-2.5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900">
                      {review.user.firstName} {review.user.lastName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {review.targetType}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReviewAction(review.id)}
                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 self-end sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs">
                No reviews found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-3">
          <div className="space-y-2.5">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-900">
                      Reported by {report.reporter.firstName} {report.reporter.lastName}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {report.contentType}
                    </Badge>
                    <Badge
                      variant={
                        report.status === 'PENDING' ? 'destructive' :
                        report.status === 'RESOLVED' ? 'default' : 'secondary'
                      }
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.reason}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {report.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReportAction(report.id, 'resolve')}
                      className="h-8 px-2.5 text-xs rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReportAction(report.id, 'reject')}
                      className="h-8 px-2.5 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs">
                No reported content found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}