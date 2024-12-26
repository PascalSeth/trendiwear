"use server";

import prisma from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function CreateProduct(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stockQuantity = parseInt(formData.get("stockQuantity") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const collectionId = formData.get("collectionId") as string;
    const sizes = (formData.get("sizes") as string)?.split(",") || [];
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const imageFile of imageFiles) {
        const { data: imageData, error } = await supabase.storage
            .from("images")
            .upload(`Products/${imageFile.name}-${Date.now()}`, imageFile, {
                cacheControl: "2592000",
                contentType: imageFile.type,
            });

        if (error) {
            console.error("Error uploading image: ", error);
            return;
        }

        imageUrls.push(imageData?.path);
    }

    await prisma.product.create({
        data: {
            name,
            description,
            price,
            stockQuantity,
            sizes,
            imageUrl: imageUrls,
            categoryId,
            collectionId,
        },
    });
}
