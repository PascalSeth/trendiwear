/**
 * Standardized Service Transformation Layer
 * Decouples database models (Base Service vs Professional Offering) 
 * from the unified UI representation.
 */

// --- Input Types (Prisma) ---

/** Raw result from prisma.service */
export interface BaseServiceInput {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  imageUrl: string | null;
  categoryId: string;
  isHomeService: boolean;
  isActive: boolean;
  requirements: string | null; // Legacy catalog requirements string
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: { name: string } | null;
  _count?: { bookings: number };
}

/** Raw result from prisma.professionalService (with relations) */
export interface ProfessionalServiceInput {
  id: string;
  professionalId: string;
  serviceId: string;
  price: number;
  durationOverride: number | null;
  isActive: boolean;
  images: string[] | Array<{ url: string }>;
  service: BaseServiceInput;
  professional?: {
    firstName: string;
    lastName: string;
    professionalProfile?: { businessName: string };
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
  requirements?: Array<{ // Relation array
    id: string;
    question: string;
    type: string;
    isRequired: boolean;
  }>;
}

// --- Output Type (UI) ---

/** Unified format used by Frontend Components & Dashboard */
export interface TransformedService {
  id: string; // The base service entry-point ID
  professionalServiceId: string | null; // The link ID for this professional's offering
  professionalId: string | null;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  durationOverride: number | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName?: string | null;
  isHomeService: boolean;
  isActive: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Requirements: Decoupled to avoid name collisions
  catalogRequirements: string | null; // From the base Service model
  customRequirements: Array<{ // From the ProfessionalService model
    id: string;
    question: string;
    type: string;
    isRequired: boolean;
  }>;
  
  professional?: {
    firstName: string;
    lastName: string;
    businessName?: string;
  } | null;
  
  images: Array<{ url: string }>;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
  addons: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
  
  bookingsCount: number;
}

// --- Transformation Logic ---

function mapFromBase(base: BaseServiceInput): TransformedService {
  return {
    id: base.id,
    professionalServiceId: null,
    professionalId: null,
    name: base.name,
    description: base.description,
    price: 0,
    duration: base.duration,
    durationOverride: null,
    imageUrl: base.imageUrl,
    categoryId: base.categoryId,
    categoryName: base.category?.name || null,
    isHomeService: base.isHomeService,
    isActive: base.isActive,
    isCustom: base.isCustom,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    catalogRequirements: base.requirements,
    customRequirements: [],
    images: base.imageUrl ? [{ url: base.imageUrl }] : [],
    variants: [],
    addons: [],
    bookingsCount: base._count?.bookings || 0,
  };
}

function mapFromProfessional(ps: ProfessionalServiceInput): TransformedService {
  const base = ps.service;
  
  // Map images to consistent format
  const images = (ps.images || []).map(img => 
    typeof img === 'string' ? { url: img } : img
  );

  return {
    id: base.id,
    professionalServiceId: ps.id,
    professionalId: ps.professionalId,
    name: base.name,
    description: base.description,
    price: ps.price,
    duration: ps.durationOverride || base.duration,
    durationOverride: ps.durationOverride,
    imageUrl: ps.service.imageUrl,
    categoryId: base.categoryId,
    categoryName: base.category?.name || null,
    isHomeService: base.isHomeService,
    isActive: ps.isActive,
    isCustom: base.isCustom,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    catalogRequirements: base.requirements,
    customRequirements: ps.requirements || [],
    professional: ps.professional ? {
      firstName: ps.professional.firstName,
      lastName: ps.professional.lastName,
      businessName: ps.professional.professionalProfile?.businessName,
    } : null,
    images: images as Array<{ url: string }>,
    variants: ps.variants || [],
    addons: ps.addons || [],
    bookingsCount: base._count?.bookings || 0,
  };
}

/**
 * Universal transformer for services.
 * Automatically identifies and maps from both base Service and ProfessionalService models.
 */
export function transformToService(data: unknown): TransformedService | null {
  if (!data || typeof data !== 'object') return null;
  
  const d = data as Record<string, unknown>;
  // Type identification
  const isProfessional = !!d.service && typeof d.service === 'object';
  
  if (isProfessional) {
    return mapFromProfessional(data as ProfessionalServiceInput);
  }
  
  // Standard check for base service
  if (d.id && d.name) {
    return mapFromBase(data as BaseServiceInput);
  }

  return null;
}
