import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';
import ProductClient from '@/app/(pages)/shopping/products/[slug]/ProductClient';
import { AtelierBackground } from '@/app/components/creative/AtelierBackground';
import Link from 'next/link';
import { ArrowLeft, MapPin, BadgeCheck, MessageSquare, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface Props {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productSlug } = await params;
  
  const [profile, product] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { slug },
      select: { businessName: true, bio: true, specialization: { select: { name: true } } }
    }),
    prisma.product.findUnique({
      where: { slug: productSlug, isActive: true },
      select: { name: true, description: true, images: true }
    })
  ]);

  if (!profile || !product) {
    return { title: 'Product Not Found' };
  }

  const title = `${product.name} — Crafted by ${profile.businessName}`;
  const description = `${profile.businessName} (${profile.specialization.name}): ${product.description || profile.bio}`.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    }
  };
}

export default async function BoutiqueProductPage({ params }: Props) {
  const { slug, productSlug } = await params;
  const session = await getAuthSession();

  // Fetch full data in parallel
  const [profile, productInfo] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { slug },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, profileImage: true, email: true } },
        specialization: { select: { name: true } }
      }
    }),
    prisma.product.findUnique({
      where: { slug: productSlug, isActive: true },
      select: { id: true }
    })
  ]);

  if (!profile || !productInfo) {
    notFound();
  }

  const productId = productInfo.id;

  // Fetch product detail and reviews
  const [product, reviews, purchase, hasReviewed] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: { select: { name: true, slug: true } },
        collections: { select: { name: true } },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            professionalProfile: {
              select: {
                slug: true,
                businessName: true,
                businessImage: true,
                rating: true,
                totalReviews: true,
                isVerified: true,
                bio: true,
                location: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true,
            orderItems: true
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { targetId: productId, targetType: 'PRODUCT' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        replies: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    session?.user?.id ? prisma.order.findFirst({
      where: { customerId: session.user.id, status: "DELIVERED", items: { some: { productId } } },
      select: { id: true }
    }) : null,
    session?.user?.id ? prisma.review.findUnique({
      where: { userId_targetId_targetType: { userId: session.user.id, targetId: productId, targetType: 'PRODUCT' } }
    }) : null
  ]);

  if (!product) notFound();

  const initialData = JSON.parse(JSON.stringify(product));
  const initialReviews = JSON.parse(JSON.stringify(reviews));

  return (
    <div className="min-h-screen bg-white selection:bg-stone-900 selection:text-white">
      <AtelierBackground />
      
      {/* 1. Contextual Header (Boutique Navigation) */}
      <header className="fixed top-0 inset-x-0 z-[60] h-20 bg-white/70 backdrop-blur-xl border-b border-stone-200/50 px-6 lg:px-12 flex items-center justify-between">
        <Link href={`/tz/${slug}/shop`} className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-stone-500 hover:text-stone-900 transition-all border-b border-transparent hover:border-stone-900 pb-1">
          <ArrowLeft size={14} /> Back to {profile.businessName}&apos;s Shop
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-900">{profile.businessName}</p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">{profile.specialization.name}</p>
          </div>
          <Link href={`/tz/${slug}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200">
               <Image 
                 src={profile.businessImage || '/placeholder-avatar.jpg'} 
                 alt={profile.businessName} 
                 width={40} 
                 height={40} 
                 className="w-full h-full object-cover" 
               />
            </div>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Reusing ProductClient for the main body but without its standard header */}
        <div className="pt-20">
          <ProductClient 
            initialProduct={initialData} 
            initialReviews={initialReviews}
            isLoggedIn={!!session?.user}
            hasPurchased={!!purchase}
            hasReviewed={!!hasReviewed}
          />
        </div>

        {/* 2. Enhanced Boutique Context Footer (Atelier Finish) */}
        <section className="bg-stone-50/50 border-t border-stone-100 py-24 md:py-32">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-12 gap-16 items-start">
               {/* Brand Story */}
               <div className="lg:col-span-7 space-y-12">
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-stone-400">The Artisan</span>
                    <h2 className="text-5xl lg:text-7xl font-serif text-stone-900 leading-none">
                       {profile.businessName}
                    </h2>
                  </div>
                  <p className="text-xl md:text-2xl font-serif text-stone-600 leading-relaxed italic border-l-4 border-amber-500 pl-8 lg:pl-12 max-w-3xl">
                    &ldquo;{profile.bio || "Craftsmanship that celebrates identity, precision, and the art of modern fashion."}&rdquo;
                  </p>
                  
                  <div className="flex flex-wrap gap-12 pt-8">
                     <div className="space-y-2">
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400">Location</p>
                        <div className="flex items-center gap-2 text-stone-900 font-mono text-xs uppercase tracking-widest">
                           <MapPin size={14} className="text-amber-600" />
                           {profile.location || "Studio Address"}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400">Status</p>
                        <div className="flex items-center gap-2 text-amber-600 font-mono text-xs uppercase tracking-widest">
                           <BadgeCheck size={14} />
                           Verified Atelier
                        </div>
                     </div>
                  </div>

                  <div className="pt-8">
                    <Link href={`/tz/${slug}/shop`} className="group inline-flex items-center gap-6 bg-stone-950 text-white px-10 py-5 rounded-full hover:bg-black transition-all shadow-2xl">
                       <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Explore Entire Shop</span>
                       <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
               </div>

               {/* Right Side Call to Action */}
               <div className="lg:col-span-5 bg-white rounded-[3rem] p-12 lg:p-16 border border-stone-200/60 shadow-xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                     <ShoppingBag size={200} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif text-stone-900">Bespoke Inquiries</h3>
                    <p className="text-stone-500 text-sm font-serif italic">Interested in a custom variation of this piece?</p>
                  </div>
                  
                  <div className="pt-6 space-y-4">
                    <button className="w-full flex items-center justify-center gap-4 py-5 rounded-full border-2 border-stone-900 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all group">
                       <MessageSquare size={16} /> Consult with {profile.user.firstName}
                    </button>
                    
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this handcrafted ${product.name} by ${profile.businessName} on TrendiZip: https://trendizip.com/tz/${slug}/shop/${productSlug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-4 py-5 rounded-full bg-[#25D366] text-white text-[10px] font-mono font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-emerald-500/10"
                    >
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.983.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.432h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                       Share on WhatsApp
                    </a>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
