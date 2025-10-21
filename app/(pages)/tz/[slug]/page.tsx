import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  specialization: {
    name: string;
  };
}

async function getProfile(slug: string): Promise<ProfessionalProfile | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/professional-profiles/slug/${slug}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export default async function Profile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    notFound();
  }

  // Determine display name: business name if professional, otherwise first + last name
  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;

  // Use business image if available, otherwise profile image
  const backgroundImage = profile.businessImage || profile.user.profileImage || "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=100&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div className="relative">
      <div className="relative w-full h-screen">
        <Image
          src={backgroundImage}
          alt={`${displayName} Profile Background`}
          className="w-full h-full object-cover object-center"
          fill
          quality={100}
          priority
        />

        {/* For larger screens */}
        <div className="absolute max-lg:hidden top-1/3 right-20 flex flex-col items-center justify-center text-white space-y-4">
          <h3 className="text-5xl font-bold">{displayName}</h3>
          <p className="text-sm font-medium tracking-wide">{profile.specialization.name}</p>
          <p className="mt-4 text-lg">
            {profile.rating ? `${profile.rating.toFixed(1)} Star Rating` : ''}
            {profile.totalReviews ? ` (${profile.totalReviews} reviews)` : ''}
          </p>
          <Link href={`/tz/${slug}/shop`}>
            <button className="mt-6 px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition duration-300">
              SHOP NOW
            </button>
          </Link>
        </div>

        {/* For smaller screens */}
        <div className="lg:hidden absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center text-black bg-white bg-opacity-80 px-6 py-4 rounded-md shadow-md space-y-3">
          <h3 className="text-3xl font-bold">{displayName}</h3>
          <p className="text-xs font-medium tracking-wide">{profile.specialization.name} | Professional Tailor</p>
          <p className="mt-2 text-base">
            {profile.rating ? `${profile.rating.toFixed(1)} Star Rating` : ''}
            {profile.totalReviews ? ` (${profile.totalReviews} reviews)` : ''}
          </p>
          <Link href={`/tz/${slug}/shop`}>
            <button className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition duration-300">
              SHOP NOW
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
