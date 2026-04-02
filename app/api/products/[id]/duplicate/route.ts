import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const user = await requireRole(["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"]);

    // Fetch the original product
    const originalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        collection: true,
      },
    });

    if (!originalProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if the user owns the product (if they are a professional)
    if (user.role === "PROFESSIONAL" && originalProduct.professionalId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create a new product with duplicated data
    const duplicatedProduct = await prisma.product.create({
      data: {
        name: `Copy of ${originalProduct.name}`,
        description: originalProduct.description,
        price: originalProduct.price,
        currency: originalProduct.currency,
        stockQuantity: originalProduct.stockQuantity,
        images: originalProduct.images,
        videoUrl: originalProduct.videoUrl,
        categoryId: originalProduct.categoryId,
        collectionId: originalProduct.collectionId,
        professionalId: originalProduct.professionalId,
        sizes: originalProduct.sizes,
        colors: originalProduct.colors,
        material: originalProduct.material,
        careInstructions: originalProduct.careInstructions,
        estimatedDelivery: originalProduct.estimatedDelivery,
        isCustomizable: originalProduct.isCustomizable,
        isUnisex: originalProduct.isUnisex,
        isActive: false, // Start as inactive to allow review of the copy
        isInStock: originalProduct.isInStock,
        allowPickup: originalProduct.allowPickup,
        allowDelivery: originalProduct.allowDelivery,
        tags: originalProduct.tags,
        // Reset metrics
        viewCount: 0,
        wishlistCount: 0,
        cartCount: 0,
        soldCount: 0,
        submittedForShowcase: false,
        isShowcaseApproved: false,
      },
      include: {
        category: {
            select: { name: true }
        },
        collection: {
            select: { name: true }
        },
        professional: {
            select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                    select: { businessName: true }
                }
            }
        },
        _count: {
          select: {
            wishlistItems: true,
            cartItems: true,
            orderItems: true,
          },
        },
      },
    });
    return NextResponse.json(duplicatedProduct);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (typeof status === 'number') {
        return NextResponse.json({ error: error.message }, { status });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[PRODUCT_DUPLICATE_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
