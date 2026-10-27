"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ExternalLink, Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface UnsplashPhoto {
  id: string;
  description: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  color: string;
  width: number;
  height: number;
  downloadLocation: string;
  photographer: {
    name: string;
    username: string;
    profileUrl: string;
    profileImage?: string;
  };
  unsplashUrl: string;
}

const POPULAR_TREND_TAGS = [
  { id: 'streetwear', label: 'Streetwear Model' },
  { id: 'y2k', label: 'Y2K Trend' },
  { id: 'ankara', label: 'African Ankara Fashion' },
  { id: 'quiet-luxury', label: 'Quiet Luxury Outfit' },
  { id: 'bohemian', label: 'Boho Chic Fashion' },
  { id: 'vintage', label: '90s Retro Style' },
  { id: 'minimalist', label: 'Minimalist Chic' },
  { id: 'high-fashion', label: 'Runway High Fashion' },
];

interface UnsplashModelGalleryProps {
  searchQuery?: string;
  title?: string;
  showSearchBar?: boolean;
}

export default function UnsplashModelGallery({
  searchQuery: externalSearchQuery,
  title = "Live Model Inspirations",
  showSearchBar = true,
}: UnsplashModelGalleryProps) {
  const [query, setQuery] = useState(externalSearchQuery || 'fashion model');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPhotos = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&per_page=16`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching model photos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeQuery = externalSearchQuery || 'fashion model';
    setQuery(activeQuery);
    setPage(1);
    fetchPhotos(activeQuery, 1);
  }, [externalSearchQuery, fetchPhotos]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    fetchPhotos(query, 1);
  };

  const handleTagClick = (tagLabel: string) => {
    setQuery(tagLabel);
    setPage(1);
    fetchPhotos(tagLabel, 1);
  };

  // Trigger Unsplash Download API event when user clicks or downloads a photo
  const handlePhotoClick = async (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    try {
      await fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      });
    } catch (err) {
      console.warn('Failed to track download event:', err);
    }
  };

  return (
    <div className="w-full">
      {/* SECTION TITLE & HEADER */}
      <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 italic font-medium leading-none mb-2">
            {title}
          </h2>
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.4em]">
            Editorial Model Gallery &amp; Style Inspiration
          </p>
        </div>
      </div>

      {/* SEARCH & TAGS CONTROLS */}
      {showSearchBar && (
        <div className="mb-12 space-y-6">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trend models (e.g. Ankara Luxury, Y2K Denim, Streetwear)..."
              className="w-full bg-white border border-stone-200 py-4 pl-14 pr-32 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-all font-light shadow-sm text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-900 text-white px-6 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Explore'}
            </button>
          </form>

          {/* POPULAR TREND TAGS */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mr-2 flex items-center gap-1">
              <Search className="h-3 w-3 text-stone-400" /> Quick Trends:
            </span>
            {POPULAR_TREND_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.label)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all border ${
                  query.toLowerCase() === tag.label.toLowerCase()
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MASONRY PHOTO GRID */}
      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {[
            "aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[3/4]",
            "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]"
          ].map((aspect, i) => (
            <div key={i} className="break-inside-avoid mb-6 bg-white border border-stone-200 overflow-hidden shadow-xs">
              <Skeleton className={`w-full ${aspect} rounded-none bg-stone-200/70`} />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-3/4 rounded-xs bg-stone-200/60" />
                <Skeleton className="h-2.5 w-1/2 rounded-xs bg-stone-200/40" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl italic text-stone-400 mb-4">No model pictures found for &quot;{query}&quot;</p>
          <button
            onClick={() => handleTagClick('Streetwear Model')}
            className="text-xs font-mono uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-1"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className="break-inside-avoid mb-6 bg-white border border-stone-100 overflow-hidden group hover:shadow-xl transition-all duration-500"
            >
              {/* IMAGE CONTAINER (Hotlinked directly to Unsplash) */}
              <div
                onClick={() => handlePhotoClick(photo)}
                className="relative cursor-pointer overflow-hidden bg-stone-100"
                style={{ backgroundColor: photo.color || '#f5f5f4' }}
              >
                <img
                  src={photo.urls.regular}
                  alt={photo.description}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* OVERLAY ON HOVER */}
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white text-stone-900 px-4 py-2 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    View Full Inspiration <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* UNSPLASH ATTRIBUTION (Required by Unsplash Production Guidelines) */}
              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span className="truncate max-w-[200px]">
                  Photo by{' '}
                  <a
                    href={photo.photographer.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-stone-900 hover:underline"
                  >
                    {photo.photographer.name}
                  </a>{' '}
                  on{' '}
                  <a
                    href={photo.unsplashUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-stone-900 hover:underline"
                  >
                    Unsplash
                  </a>
                </span>
                <a
                  href={photo.urls.full}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePhotoClick(photo)}
                  className="text-stone-400 hover:text-stone-900 p-1"
                  title="Download High-Res"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && !loading && (
        <div className="mt-16 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
              fetchPhotos(query, newPage);
            }}
            className="px-6 py-2.5 border border-stone-200 text-xs font-mono uppercase tracking-widest disabled:opacity-40 hover:bg-stone-900 hover:text-white transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
              fetchPhotos(query, newPage);
            }}
            className="px-6 py-2.5 border border-stone-200 text-xs font-mono uppercase tracking-widest disabled:opacity-40 hover:bg-stone-900 hover:text-white transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL FOR FULL-RES IMAGE & DETAILED ATTRIBUTION */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col md:flex-row relative"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 bg-stone-900/80 text-white p-2 hover:bg-stone-900 transition-colors rounded-full"
              >
                <X className="h-5 w-5" />
              </button>

              {/* IMAGE DISPLAY */}
              <div className="flex-1 bg-stone-950 flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
                <img
                  src={selectedPhoto.urls.regular}
                  alt={selectedPhoto.description}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>

              {/* DETAILS & ATTRIBUTION PANEL */}
              <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-white border-l border-stone-100">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {selectedPhoto.photographer.profileImage && (
                      <img
                        src={selectedPhoto.photographer.profileImage}
                        alt={selectedPhoto.photographer.name}
                        className="w-10 h-10 rounded-full border border-stone-200 object-cover"
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-stone-900">
                        <a
                          href={selectedPhoto.photographer.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {selectedPhoto.photographer.name}
                        </a>
                      </h4>
                      <p className="text-[11px] font-mono text-stone-400">
                        @{selectedPhoto.photographer.username}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 font-light italic mb-6">
                    &quot;{selectedPhoto.description}&quot;
                  </p>

                  <div className="p-4 bg-stone-50 border border-stone-200/60 mb-6 text-[11px] font-mono text-stone-500 space-y-1">
                    <div className="font-semibold text-stone-900 uppercase tracking-widest text-[9px] mb-2">
                      Photo Attribution
                    </div>
                    <p>
                      Photo by{' '}
                      <a
                        href={selectedPhoto.photographer.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-900 underline font-medium"
                      >
                        {selectedPhoto.photographer.name}
                      </a>{' '}
                      on{' '}
                      <a
                        href={selectedPhoto.unsplashUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-900 underline font-medium"
                      >
                        Unsplash
                      </a>
                    </p>
                  </div>
                </div>

                <a
                  href={selectedPhoto.urls.full}
                  target="_blank"
                  download
                  rel="noopener noreferrer"
                  className="w-full bg-stone-900 text-white py-3 text-xs font-mono uppercase tracking-widest text-center flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download High-Res
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
