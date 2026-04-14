import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API: Request received");

    // Validate environment variables at runtime for better logging
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("Upload API: Missing Supabase environment variables", {
        hasUrl: !!url,
        hasKey: !!key
      });
      return NextResponse.json({
        error: "Server Configuration Error",
        details: "Supabase environment variables are missing. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        missingConfigs: {
          url: !url,
          key: !key
        }
      }, { status: 500 });
    }

    // Check if Supabase is properly configured
    if (!supabase) {
      console.error("Upload API: Supabase client failed to initialize");
      return NextResponse.json({
        error: "Upload Service Offline",
        details: "The Supabase client could not be initialized. Please check your system logs."
      }, { status: 500 });
    }

    console.log("Upload API: Authenticating user...");
    let user;
    try {
      user = await requireAuth();
      console.log("Upload API: User authenticated:", user.id);
    } catch (authError) {
      console.error("Upload API: Authentication failed", authError);
      return NextResponse.json({ 
        error: "Authentication required", 
        details: "You must be logged in to upload files." 
      }, { status: 401 });
    }

    console.log("Upload API: Parsing form data...");
    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("Upload API: Failed to parse form data", e);
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "images";
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      console.log("Upload API: No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate bucket - only allow images, documents, videos
    const allowedBuckets = ['images', 'documents', 'videos', 'categories'];
    let targetBucket = bucket || "images";
    let targetFolder = folder || "uploads";

    if (!allowedBuckets.includes(targetBucket)) {
      targetFolder = targetBucket;
      targetBucket = "images";
    }

    // Validate file type
    let allowedTypes: string[] = [];
    if (targetBucket === 'videos') {
      allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
    } else if (targetBucket === 'images' || targetBucket === 'categories') {
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    } else if (targetBucket === 'documents') {
      allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'];
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type",
        details: `Allowed types for ${targetBucket}: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size
    let maxSize: number;
    if (targetBucket === 'videos') maxSize = 50 * 1024 * 1024;
    else if (targetBucket === 'documents') maxSize = 25 * 1024 * 1024;
    else maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json({
        error: "File too large",
        details: `Maximum size for ${targetBucket} is ${targetBucket === 'videos' ? '50MB' : targetBucket === 'documents' ? '25MB' : '10MB'}.`
      }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${targetFolder}/${user.id}/${timestamp}.${fileExt}`;

    console.log(`Upload API: Attempting upload to bucket: '${targetBucket}', path: '${fileName}'`);

    // Upload to specified bucket
    const { data, error } = await supabase.storage.from(targetBucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error(`Upload API: Supabase error:`, error);
      
      if (error.message?.includes('Bucket not found')) {
        return NextResponse.json({
          error: "Storage bucket missing",
          details: `The '${targetBucket}' bucket does not exist in Supabase storage.`
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: "Upload failed", 
        details: error.message 
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(fileName);

    console.log("Upload API: Success");
    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      bucket: targetBucket,
      provider: 'supabase',
      success: true
    });
  } catch (error) {
    console.error("Upload API: Unexpected error", error);
    const { status, message } = mapErrorToResponse(error, { route: 'upload.POST' });
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: status || 500 });
  }
}
