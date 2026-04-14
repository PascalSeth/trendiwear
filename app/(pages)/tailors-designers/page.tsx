import { prisma } from '@/lib/prisma';
import TailorsClient from './TailorsClient';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: "Top Fashion Designers & Tailors in Ghana | TrendiZip",
  description: "Find expert tailors and fashion designers in Accra, Kumasi & across Ghana. Book bespoke tailoring, custom Ankara dresses, Kente styling, seamstresses & African fashion services. Browse profiles, view portfolios & book online.",
  keywords: [
    "tailors in Accra", "fashion designers Ghana", "fashion designers Accra",
    "bespoke tailoring Ghana", "bespoke tailoring Accra", "custom dresses Ghana",
    "seamstress Ghana", "seamstress in Accra", "African clothing designers Ghana",
    "African fashion designers Ghana", "online tailors Ghana",
    "Kente styling Ghana", "Ankara sewing Ghana", "custom Ankara dresses Ghana",
    "made in Ghana fashion", "book tailor online Ghana", "TrendiZip designers"
  ],
  alternates: {
    canonical: 'https://trendizip.com/tailors-designers',
  },
  openGraph: {
    title: "Top Fashion Designers & Tailors in Ghana | TrendiZip",
    description: "Book expert tailors and fashion designers in Accra, Kumasi & across Ghana. Custom Ankara dresses, Kente styling & bespoke tailoring.",
    url: 'https://trendizip.com/tailors-designers',
    siteName: 'TrendiZip',
    locale: 'en_GH',
    type: 'website',
  },
};

export default async function Page() {
  // Fetch all professionals directly on the server
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      user: {
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          professionalServices: {
            select: {
              price: true,
            },
            take: 10,
          },
          _count: {
            select: {
              products: true,
              professionalServices: true,
            },
          },
        },
      },
      specialization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      completedOrders: 'desc', // Sort by experience/success
    },
  });

  // Hydrate with clean data
  const initialData = JSON.parse(JSON.stringify(professionals));

  // LocalBusiness list JSON-LD for rich results
  const tailorsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Fashion Designers & Tailors in Ghana",
    "description": "Expert tailors, seamstresses and fashion designers available for booking across Ghana.",
    "url": "https://trendizip.com/tailors-designers",
    "numberOfItems": professionals.length,
    "itemListElement": professionals.slice(0, 20).map((prof, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "@id": `https://trendizip.com/tz/${prof.slug}`,
        "name": prof.businessName || `${prof.user.firstName} ${prof.user.lastName}`,
        "url": `https://trendizip.com/tz/${prof.slug}`,
        "image": prof.businessImage || undefined,
        "description": `${prof.specialization?.name || 'Fashion'} specialist available for bespoke tailoring in Ghana.`,
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "GH"
        },
        "areaServed": { "@type": "Country", "name": "Ghana" },
        ...(prof.rating && prof.totalReviews ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": prof.rating.toFixed(1),
            "reviewCount": prof.totalReviews,
            "bestRating": "5",
            "worstRating": "1"
          }
        } : {}),
      }
    }))
  };

  return (
    <>
      <JsonLd schema={tailorsSchema} />
      <TailorsClient initialProfessionals={initialData} />
    </>
  );
}