// types/category.ts
export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  order: number;
  parent?: {
    id: string;
    name: string;
  };
  children: Array<{
    id: string;
    name: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    products: number;
  };
};