import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white">
        <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <h1 className="text-xl font-serif text-stone-900 mb-2">Profile Not Found</h1>
        <p className="text-stone-500 mb-6 text-sm">We couldn&apos;t find this professional.</p>
        <Link
          href="/professionals"
          className="inline-block bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-colors shadow-lg"
        >
          Browse Professionals
        </Link>
      </div>
    </div>
  );
}
