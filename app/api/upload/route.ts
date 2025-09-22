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
    const bucket = (formData.get("bucket") as string) || "general"
    const folder = (formData.get("folder") as string) || "uploads"

    console.log("Form data parsed:", { bucket, folder, hasFile: !!file })

    if (!file) {
      console.log("No file provided in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    console.log("Validating file type:", file.type)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      console.log("Invalid file type:", file.type)
      return NextResponse.json({
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    console.log("Validating file size:", file.size)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log("File too large:", file.size, "max:", maxSize)
      return NextResponse.json({
        error: "File too large. Maximum size is 5MB."
      }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const timestamp = Date.now()
    const fileName = `${folder}/${user.id}/${timestamp}.${fileExt}`

    // Set bucket to images for all image uploads
    const imageBucket = "images"

    console.log("Generated filename:", fileName)
    console.log("Using Supabase for images bucket")

    if (!supabase) {
      return NextResponse.json({
        error: "Supabase storage is not configured. Image uploads require Supabase."
      }, { status: 500 })
    }

    console.log("Attempting Supabase upload...")
    // Upload to images bucket
    const { data, error } = await supabase.storage.from(imageBucket).upload(fileName, file, {
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
          error: `Storage bucket '${imageBucket}' not found. Please create it in your Supabase dashboard.`,
          details: "Go to Storage → Create bucket"
        }, { status: 500 })
      }

      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(imageBucket).getPublicUrl(fileName)

    console.log("Supabase upload successful")
    const uploadResult = {
      url: publicUrl,
      path: data.path,
      bucket: imageBucket,
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
