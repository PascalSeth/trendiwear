'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Search,
  FileText,
  Image as ImageIcon,
  X,
  Save,
  Loader2,
  Upload
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface Blog {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  imageUrl: string | null
  tags: string[]
  category: string | null
  authorId: string
  isPublished: boolean
  isFeatured: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  author: {
    firstName: string
    lastName: string
    profileImage: string | null
    professionalProfile?: {
      businessName: string | null
    }
  }
}

const BLOG_CATEGORIES = [
  { value: 'STREET_STYLE', label: 'Street Style' },
  { value: 'SUSTAINABLE_FASHION', label: 'Sustainable Fashion' },
  { value: 'DESIGNER_SPOTLIGHT', label: 'Designer Spotlight' },
  { value: 'ACCESSORIES', label: 'Accessories' },
  { value: 'FASHION_TECH', label: 'Fashion Tech' },
  { value: 'VINTAGE_REVIVAL', label: 'Vintage Revival' },
]

interface BlogFormData {
  title: string
  slug: string
  content: string
  excerpt: string
  imageUrl: string
  tags: string[]
  category: string
  isPublished: boolean
  isFeatured: boolean
}

const getDefaultBlog = (): BlogFormData => {
  return {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    imageUrl: '',
    tags: [],
    category: '',
    isPublished: false,
    isFeatured: false,
  }
}

export default function BlogsManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [formData, setFormData] = useState<BlogFormData>(getDefaultBlog())
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blogs?dashboard=true&limit=100')
      const data = await res.json()
      setBlogs(data.blogs || [])
    } catch {
      toast.error('Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: selectedBlog ? prev.slug : generateSlug(title)
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const openCreateDialog = () => {
    setSelectedBlog(null)
    setFormData(getDefaultBlog())
    setImageFile(null)
    setImagePreview(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (blog: Blog) => {
    setSelectedBlog(blog)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || '',
      imageUrl: blog.imageUrl || '',
      tags: (blog.tags || []) as string[],
      category: blog.category || '',
      isPublished: blog.isPublished,
      isFeatured: blog.isFeatured,
    })
    setImageFile(null)
    setImagePreview(blog.imageUrl || null)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsDeleteDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'images')
    formData.append('folder', 'blogs')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await res.json()
    return data.url
  }

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      
      let imageUrl = formData.imageUrl
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        try {
          imageUrl = await uploadImage(imageFile)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to upload image')
          return
        } finally {
          setUploading(false)
        }
      }
      
      const url = selectedBlog ? `/api/blogs/${selectedBlog.id}` : '/api/blogs'
      const method = selectedBlog ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          category: formData.category || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save blog')
      }

      toast.success(selectedBlog ? 'Blog updated successfully' : 'Blog created successfully')
      setIsDialogOpen(false)
      fetchBlogs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedBlog) return

    try {
      setSaving(true)
      const res = await fetch(`/api/blogs/${selectedBlog.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete blog')

      toast.success('Blog deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedBlog(null)
      fetchBlogs()
    } catch {
      toast.error('Failed to delete blog')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (blog: Blog) => {
    try {
      const res = await fetch(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !blog.isPublished }),
      })

      if (!res.ok) throw new Error('Failed to update blog')

      toast.success(blog.isPublished ? 'Blog unpublished' : 'Blog published')
      fetchBlogs()
    } catch {
      toast.error('Failed to update blog')
    }
  }

  const toggleFeatured = async (blog: Blog) => {
    try {
      const res = await fetch(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !blog.isFeatured }),
      })

      if (!res.ok) throw new Error('Failed to update blog')

      toast.success(blog.isFeatured ? 'Blog unfeatured' : 'Blog featured')
      fetchBlogs()
    } catch {
      toast.error('Failed to update blog')
    }
  }

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Official Blog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage TrendiZip official blog posts
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="h-3.5 w-3.5" />
          New Blog Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Total Posts</span>
            <FileText className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{blogs.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Published</span>
            <Eye className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {blogs.filter(b => b.isPublished).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Drafts</span>
            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-amber-600">
            {blogs.filter(b => !b.isPublished).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Featured</span>
            <Star className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-indigo-600">
            {blogs.filter(b => b.isFeatured).length}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 sm:h-9 pl-8 text-xs rounded-lg border-slate-200"
              />
            </div>
          </div>
        </div>
        <div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-9 text-[10px] font-mono uppercase bg-slate-50/70 border-b border-slate-200">
                  <TableHead className="w-[300px] text-[10px] py-2 px-3 sm:px-4">Title</TableHead>
                  <TableHead className="text-[10px] py-2 px-3 sm:px-4">Category</TableHead>
                  <TableHead className="text-[10px] py-2 px-3 sm:px-4">Status</TableHead>
                  <TableHead className="text-[10px] py-2 px-3 sm:px-4">Views</TableHead>
                  <TableHead className="text-[10px] py-2 px-3 sm:px-4">Created</TableHead>
                  <TableHead className="text-right text-[10px] py-2 px-3 sm:px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      No blog posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBlogs.map((blog) => (
                    <TableRow key={blog.id} className="text-xs hover:bg-slate-50/50">
                      <TableCell className="py-2 sm:py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          {blog.imageUrl ? (
                            <Image
                              src={blog.imageUrl}
                              alt={blog.title}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 line-clamp-1">{blog.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {blog.excerpt || 'No excerpt'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-3 sm:px-4">
                        {blog.category ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {BLOG_CATEGORIES.find(c => c.value === blog.category)?.label || blog.category}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          {blog.isPublished ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[10px] px-1.5 py-0">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Draft</Badge>
                          )}
                          {blog.isFeatured && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-3 sm:px-4 font-mono text-[11px]">{blog.viewCount.toLocaleString()}</TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-3 sm:px-4 text-[11px] text-slate-500">{formatDate(blog.createdAt)}</TableCell>
                      <TableCell className="text-right py-2 sm:py-2.5 px-3 sm:px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePublish(blog)}
                            title={blog.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {blog.isPublished ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleFeatured(blog)}
                            title={blog.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            {blog.isFeatured ? (
                              <StarOff className="h-3.5 w-3.5" />
                            ) : (
                              <Star className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(blog)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(blog)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
            </DialogTitle>
            <DialogDescription>
              {selectedBlog
                ? 'Update your blog post details below.'
                : 'Create a new official TrendiZip blog post.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter blog title"
              />
            </div>

            {/* Slug */}
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="blog-post-url-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{formData.slug || 'your-slug'}
              </p>
            </div>

            {/* Cover Image */}
            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={800}
                      height={400}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFile(null)
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload cover image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                )}
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Excerpt */}
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary of the blog post..."
                rows={2}
              />
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog content here..."
                rows={10}
              />
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Publish & Feature Toggles */}
            <div className="flex items-center justify-between gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isPublished: checked }))
                  }
                />
                <Label htmlFor="isPublished">Publish immediately</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isFeatured: checked }))
                  }
                />
                <Label htmlFor="isFeatured">Featured post</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {selectedBlog ? 'Update' : 'Create'} Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedBlog?.title}&quot;? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
