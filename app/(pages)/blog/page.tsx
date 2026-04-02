import { prisma } from '@/lib/prisma';
import BlogClient from './BlogClient';

export default async function Page() {
  // Fetch blogs on the server
  const blogs = await prisma.blog.findMany({
    where: {
      isPublished: true,
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
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  // Serialize and hydrate
  const initialData = JSON.parse(JSON.stringify(blogs));

  return <BlogClient initialBlogs={initialData} />;
}