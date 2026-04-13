import prisma from './prisma'

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

/**
 * Determine the verification status of a professional profile 
 * based on their isVerified flag and uploaded documents.
 */
export async function getProfessionalVerificationStatus(professionalId: string): Promise<VerificationStatus> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    select: {
      isVerified: true,
      documents: {
        select: {
          documentType: true,
          isVerified: true,
          verificationMessage: true,
        }
      }
    }
  })

  if (!profile) return 'UNVERIFIED'
  if (profile.isVerified) return 'VERIFIED'

  const docs = profile.documents
  const hasId = docs.some(d => d.documentType === 'NATIONAL_ID')
  const hasBusiness = docs.some(d => d.documentType === 'BUSINESS_REGISTRATION')

  // If they have any rejected document, we show REJECTED so they can fix it
  const hasRejection = docs.some(d => d.verificationMessage && !d.isVerified)
  if (hasRejection) return 'REJECTED'

  // If they have both required documents but aren't verified yet, they are PENDING
  if (hasId && hasBusiness) return 'PENDING'

  return 'UNVERIFIED'
}

/**
 * Check if a professional has submitted all required verification documents.
 */
export function hasSubmittedRequirements(documents: { documentType: string }[]): boolean {
  const hasId = documents.some(d => d.documentType === 'NATIONAL_ID')
  const hasBusiness = documents.some(d => d.documentType === 'BUSINESS_REGISTRATION')
  return hasId && hasBusiness
}
