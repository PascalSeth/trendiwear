import { prisma } from './prisma'

export async function checkAndAwardBadges(userId: string) {
  const profile = await prisma.userProfileExtension.findUnique({
    where: { userId },
    include: {
      badges: {
        include: { badge: true }
      },
      _count: {
        select: {
          posts: true,
          followers: true
        }
      }
    }
  })

  if (!profile) return

  const earnedBadgeIds = profile.badges.map(ub => ub.badgeId)
  const badgesToAward: string[] = []

  // Check First Post badge
  if (profile._count.posts >= 1) {
    const firstPostBadge = await prisma.badge.findFirst({
      where: { name: "First Post" }
    })
    if (firstPostBadge && !earnedBadgeIds.includes(firstPostBadge.id)) {
      badgesToAward.push(firstPostBadge.id)
    }
  }

  // Check Style Influencer badge (500 followers)
  if (profile.followerCount >= 500) {
    const influencerBadge = await prisma.badge.findFirst({
      where: { name: "Style Influencer" }
    })
    if (influencerBadge && !earnedBadgeIds.includes(influencerBadge.id)) {
      badgesToAward.push(influencerBadge.id)
    }
  }

  // Check Fashion Guru badge (1000 reputation points)
  if (profile.reputationScore >= 1000) {
    const guruBadge = await prisma.badge.findFirst({
      where: { name: "Fashion Guru" }
    })
    if (guruBadge && !earnedBadgeIds.includes(guruBadge.id)) {
      badgesToAward.push(guruBadge.id)
    }
  }

  // Award badges
  for (const badgeId of badgesToAward) {
    await prisma.userBadge.create({
      data: {
        userId: profile.id,
        badgeId
      }
    })
  }

  return badgesToAward.length > 0 ? badgesToAward : null
}

export async function updateUserLevel(userId: string) {
  const profile = await prisma.userProfileExtension.findUnique({
    where: { userId }
  })

  if (!profile) return

  // Simple leveling: every 1000 points = 1 level
  const newLevel = Math.floor(profile.experiencePoints / 1000) + 1

  if (newLevel > profile.level) {
    await prisma.userProfileExtension.update({
      where: { id: profile.id },
      data: { level: newLevel }
    })
    return newLevel
  }

  return null
}

export async function awardExperiencePoints(userId: string, points: number) {
  const profile = await prisma.userProfileExtension.upsert({
    where: { userId },
    update: {
      experiencePoints: { increment: points }
    },
    create: {
      userId,
      experiencePoints: points
    }
  })

  // Check for level up
  const newLevel = await updateUserLevel(userId)

  // Check for badges
  const newBadges = await checkAndAwardBadges(userId)

  return { profile, newLevel, newBadges }
}