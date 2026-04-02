import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const createPrismaClient = () => {
  const pool = new Pool({ 
    connectionString,
    max: 10, 
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

const RoleIds = {
  "Model": "6a9f5b93-0d8f-4fd5-856e-476729b1ac78",
  "Fashion Photographer": "9f70d549-a8db-40a4-a4a9-c347f6c4775a",
  "Vendor": "c6938ed8-1b90-4883-b499-f984274f7060",
  "Fashion Designer": "e76a8e78-4cca-4948-8b95-a9f092c0336f",
};

const categories = [
  {
    name: "Custom Tailoring",
    description: "Bespoke stitching for suits, dresses, and traditional wear.",
    imageUrl: "https://images.unsplash.com/photo-1598462047020-d9ac030a520c?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Alterations & Repairs",
    description: "Professional resizing, mending, and garment restoration.",
    imageUrl: "https://images.unsplash.com/photo-1524311583145-d4193b216067?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Bridal & Formal Wear",
    description: "Specialized design and tailoring for weddings and gala events.",
    imageUrl: "https://images.unsplash.com/photo-1594553924340-023a1a09d3b1?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Designer"],
  },
  {
    name: "Modeling & Branding",
    description: "Professional modeling for photo shoots, runway, and campaigns.",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Model"],
  },
  {
    name: "Styling & Consulting",
    description: "Wardrobe styling, fashion direction, and image consulting.",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Model", "Fashion Designer"],
  },
  {
    name: "Fabric Sourcing",
    description: "Expert selection and procurement of fabrics and textiles.",
    imageUrl: "https://images.unsplash.com/photo-1554524419-5369c76503c2?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Vendor"],
  },
  {
    name: "Apparel Customization",
    description: "Services like screen printing, embroidery, and fabric painting.",
    imageUrl: "https://images.unsplash.com/photo-1520004434532-668416a08753?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Vendor", "Fashion Designer"],
  },
  {
    name: "Fashion Photography",
    description: "Professional photo sessions, lookbook shoots, and digital content.",
    imageUrl: "https://images.unsplash.com/photo-1542038783-0215c8295aef?auto=format&fit=crop&q=80&w=800",
    proRoles: ["Fashion Photographer"],
  },
];

async function main() {
  console.log("Starting Atomic Relational Seed: Service Categories...");

  for (const cat of categories) {
    const connects = cat.proRoles.map(role => ({ id: RoleIds[role as keyof typeof RoleIds] }));

    await (prisma.serviceCategory as any).upsert({
      where: { name: cat.name },
      update: {
        description: cat.description,
        imageUrl: cat.imageUrl,
        professionalTypes: {
          set: connects, // Overwrite with correct links
        },
      },
      create: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        professionalTypes: {
          connect: connects,
        },
      },
    });

    console.log(`- Seeded & Linked: ${cat.name}`);
  }

  console.log("Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seed Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
