import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogDetailClient, { BlogPost } from './BlogDetailClient';
import { JsonLd } from '@/components/seo';

// Fetch specific blog by slug or ID
async function getBlog(slugOrId: string) {
  const blog = await prisma.blogPost.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ],
      isPublished: true
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          professionalProfile: {
            select: {
              businessName: true,
            },
          },
        },
      },
    },
  });
  return blog;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: slugOrId } = await params;
  const post = await getBlog(slugOrId);

  if (!post) return { title: 'Article Not Found' };

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on the TrendiZip Journal. Fashion insights, trends, and spotlight stories.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      url: `https://trendizip.com/blog/${post.slug}`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
      publishedTime: post.createdAt.toISOString(),
      authors: [`${post.author.firstName} ${post.author.lastName}`],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.title,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
    alternates: {
      canonical: `https://trendizip.com/blog/${post.slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: slugOrId } = await params;
  const post = await getBlog(slugOrId);

  if (!post) notFound();

  // Fetch related posts for the client
  const relatedPosts = await prisma.blogPost.findMany({
    where: { isPublished: true, id: { not: post.id } },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          professionalProfile: { select: { businessName: true } },
        },
      },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  // Articles JSON-LD
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.imageUrl ? [post.imageUrl] : [],
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.createdAt.toISOString(),
    "author": [{
      "@type": "Person",
      "name": `${post.author.firstName} ${post.author.lastName}`,
      "url": `https://trendizip.com` 
    }],
    "description": post.excerpt || post.title,
    "publisher": {
      "@type": "Organization",
      "name": "TrendiZip",
      "logo": {
        "@type": "ImageObject",
        "url": "https://trendizip.com/navlogo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://trendizip.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <JsonLd schema={blogSchema} />
      <BlogDetailClient 
        post={JSON.parse(JSON.stringify(post))} 
        relatedPosts={JSON.parse(JSON.stringify(relatedPosts))} 
      />
    </>
  );
}
