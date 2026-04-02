const nextConfig = {
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    images: {
        domains: ['images.unsplash.com',"maps.googleapis.com",'media.istockphoto.com','randomuser.me','i.pinimg.com','plus.unsplash.com','img.freepik.com','images.pexels.com','gravatar.com','lh3.googleusercontent.com','tesrxsguhjwbvlnqiike.supabase.co'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
        formats: ['image/webp', 'image/avif'],
    }
};

export default nextConfig;
