import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrendiZip | Fashion Atelier & Marketplace',
    short_name: 'TrendiZip',
    description: 'Wear the Trend, Set the Trend with TrendiZip - Your Ultimate Fashion Destination!',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF9',
    theme_color: '#000000',
    icons: [
      {
        src: '/navlogo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
