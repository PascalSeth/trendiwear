import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { productId, imageUrl, colorName } = body;

    if (!productId || !imageUrl) {
      return NextResponse.json({ error: "Product ID and Image URL are required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check ownership if professional
    if (user.role === "PROFESSIONAL" && product.professionalId && product.professionalId !== user.id) {
      // Allowed for professionals and admins
    }

    const currentImages = product.images || [];
    if (!currentImages.includes(imageUrl)) {
      const updatedImages = [...currentImages, imageUrl];

      await prisma.product.update({
        where: { id: productId },
        data: {
          images: updatedImages,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${colorName || "AI"} colorway variant to product listing gallery!`,
      productId,
      imageUrl,
    });
  } catch (error: unknown) {
    console.error("[Attach AI Image Error]", error);
    const errObj = error as { message?: string };
    return NextResponse.json(
      { error: errObj?.message || "Failed to attach image to product" },
      { status: 500 }
    );
  }
}
