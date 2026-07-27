/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
      'image.pollinations.ai',
      'pollinations.ai',
      'images.pexels.com',
      'maps.googleapis.com',
      'media.istockphoto.com',
      'randomuser.me',
      'i.pinimg.com',
      'img.freepik.com',
      'gravatar.com',
      'lh3.googleusercontent.com',
      'tesrxsguhjwbvlnqiike.supabase.co',
      'cdn.pixabay.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
