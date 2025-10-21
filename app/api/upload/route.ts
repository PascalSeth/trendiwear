import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called")

    // Check if Supabase is properly configured
    if (!supabase) {
      console.log("Supabase not configured")
      return NextResponse.json({
        error: "File upload service is not configured. Please check environment variables."
      }, { status: 500 })
    }

    console.log("Authenticating user...")
    const user = await requireAuth()
    console.log("User authenticated:", user.id)

    console.log("Parsing form data...")
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = (formData.get("bucket") as string) || "images"
    const folder = (formData.get("folder") as string) || "uploads"

    console.log("Form data parsed:", { bucket, folder, hasFile: !!file })

    if (!file) {
      console.log("No file provided in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate bucket - only allow images, documents, videos
    const allowedBuckets = ['images', 'documents', 'videos']
    const targetBucket = bucket || "images" // Default to images if not specified

    if (!allowedBuckets.includes(targetBucket)) {
      return NextResponse.json({
        error: `Invalid bucket. Allowed buckets: ${allowedBuckets.join(', ')}`
      }, { status: 400 })
    }

    // Validate file type based on bucket
    console.log("Validating file type:", file.type)
    let allowedTypes: string[] = []

    if (targetBucket === 'videos') {
      allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv']
    } else if (targetBucket === 'images') {
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    } else if (targetBucket === 'documents') {
      allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf']
    }

    if (!allowedTypes.includes(file.type)) {
      console.log("Invalid file type:", file.type, "for bucket:", targetBucket)
      return NextResponse.json({
        error: `Invalid file type for ${targetBucket} bucket. Allowed types: ${allowedTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate file size based on bucket
    console.log("Validating file size:", file.size)
    let maxSize: number
    let sizeText: string

    if (targetBucket === 'videos') {
      maxSize = 50 * 1024 * 1024 // 50MB for videos
      sizeText = "50MB"
    } else if (targetBucket === 'documents') {
      maxSize = 25 * 1024 * 1024 // 25MB for documents
      sizeText = "25MB"
    } else {
      maxSize = 10 * 1024 * 1024 // 10MB for images
      sizeText = "10MB"
    }

    if (file.size > maxSize) {
      console.log("File too large:", file.size, "max:", maxSize)
      return NextResponse.json({
        error: `File too large. Maximum size for ${targetBucket} is ${sizeText}.`
      }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const timestamp = Date.now()
    const fileName = `${folder}/${user.id}/${timestamp}.${fileExt}`

    console.log("Generated filename:", fileName)
    console.log("Using Supabase for bucket:", targetBucket)

    if (!supabase) {
      return NextResponse.json({
        error: "Supabase storage is not configured. File uploads require Supabase."
      }, { status: 500 })
    }

    console.log("Attempting Supabase upload...")
    // Upload to specified bucket
    const { data, error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Supabase upload error:", error)

      // Handle specific Supabase errors
      if (error.message?.includes('signature verification failed')) {
        return NextResponse.json({
          error: "Supabase authentication failed. Please check your SUPABASE_SERVICE_ROLE_KEY.",
          details: "The service role key appears to be invalid or expired."
        }, { status: 500 })
      }

      if (error.message?.includes('Bucket not found')) {
        return NextResponse.json({
          error: `Storage bucket '${targetBucket}' not found. Please create it in your Supabase dashboard.`,
          details: "Go to Storage → Create bucket"
        }, { status: 500 })
      }

      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(targetBucket).getPublicUrl(fileName)

    console.log("Supabase upload successful")
    const uploadResult = {
      url: publicUrl,
      path: data.path,
      bucket: targetBucket,
      provider: 'supabase'
    }

    console.log("Upload completed successfully:", uploadResult)
    return NextResponse.json({
      ...uploadResult,
      success: true
    })
  } catch (error) {
    console.error("Upload API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.log("Returning error response:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
