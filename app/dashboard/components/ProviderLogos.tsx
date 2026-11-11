'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProviderImageProps {
  className?: string;
}

export const PROVIDER_DATA: Record<
  string,
  { src: string; fallbackSrc?: string; name: string; bg: string }
> = {
  MTN: {
    src: '/images/providers/mtn.svg',
    fallbackSrc: '/images/providers/mtn.png',
    name: 'MTN MoMo',
    bg: 'bg-[#FFCC00]',
  },
  TELECEL: {
    src: '/images/providers/telecel.png',
    name: 'Telecel Cash',
    bg: 'bg-white',
  },
  AT: {
    src: '/images/providers/at.png',
    name: 'AT Money',
    bg: 'bg-white',
  },
  BANK: {
    src: '/images/providers/bank.png',
    name: 'Bank Transfer',
    bg: 'bg-slate-900',
  },
};

/**
 * Universal Provider Logo rendering the actual official branding image
 */
export const ProviderLogo: React.FC<{
  provider: string;
  className?: string;
}> = ({ provider, className = 'w-8 h-8' }) => {
  const p = (provider || '').toUpperCase();
  const [imgError, setImgError] = useState(false);

  let key = 'BANK';
  if (p.includes('MTN')) key = 'MTN';
  else if (p.includes('TELECEL') || p.includes('VOD') || p.includes('VODAFONE')) key = 'TELECEL';
  else if (p.includes('AT') || p.includes('AIRTEL') || p.includes('TIGO')) key = 'AT';

  const data = PROVIDER_DATA[key];

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200/80 p-1 shadow-2xs ${className}`}
    >
      <img
        src={imgError && data.fallbackSrc ? data.fallbackSrc : data.src}
        alt={data.name}
        onError={() => setImgError(true)}
        className="w-full h-full object-contain select-none"
        loading="eager"
      />
    </div>
  );
};

export const MtnMomoLogo: React.FC<ProviderImageProps> = ({ className = 'w-8 h-8' }) => {
  return <ProviderLogo provider="MTN" className={className} />;
};

export const TelecelCashLogo: React.FC<ProviderImageProps> = ({ className = 'w-8 h-8' }) => {
  return <ProviderLogo provider="TELECEL" className={className} />;
};

export const AtMoneyLogo: React.FC<ProviderImageProps> = ({ className = 'w-8 h-8' }) => {
  return <ProviderLogo provider="AT" className={className} />;
};

export const BankTransferLogo: React.FC<ProviderImageProps> = ({ className = 'w-8 h-8' }) => {
  return <ProviderLogo provider="BANK" className={className} />;
};
