"use server";

import prisma from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function CreateProduct(formData: FormData) {
    // Retrieve user information from the Kinde session
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("User is not authenticated.");
    }

    const userId = user.id;

    // Fetch the professional profile to get the associated professionalId
    const professionalProfile = await prisma.professionalProfile.findUnique({
        where: {
            userId,
        },
    });

    if (!professionalProfile) {
        throw new Error("Professional profile not found for the logged-in user.");
    }

    const professionalId = userId; // The `userId` from Kinde is used as the `professionalId`.

    // Collect data from the form
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    let stockQuantity = parseInt(formData.get("stockQuantity") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const estimatedArrivalTime = parseInt(formData.get("estimatedArrivalTime") as string, 10);
    const collectionId = formData.get("collectionId") as string;
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    const isNew = formData.get("isNew") === "true";
    const isFeatured = formData.get("isFeatured") === "true";
    const isTrending = formData.get("isTrending") === "true";
    const isShipped = formData.get("isShipped") === "true"; // corrected to true/false
    const rawSizes = formData.get("sizes") as string;
    let sizes: string[] = [];
    
    try {
        sizes = JSON.parse(rawSizes);
    } catch {
        sizes = rawSizes.split(",").map(size => size.trim());
    }
    // Log the received data
    console.log("Form Data Received:");
    console.log({ name, description, price, stockQuantity, categoryId, collectionId });
    console.log("Sizes:", sizes);
    console.log("Images:", imageFiles);
    console.log({ isNew, isFeatured, isTrending, isShipped });

    // If product is shipped, set stock quantity to 0
    if (isShipped) {
        stockQuantity = 0;
    }

    // Upload images to Supabase Storage
    for (const imageFile of imageFiles) {
        const { data: imageData, error } = await supabase.storage
            .from("images")
            .upload(`Products/${imageFile.name}-${Date.now()}`, imageFile, {
                cacheControl: "2592000",
                contentType: imageFile.type,
            });

        if (error) {
            console.error("Error uploading image: ", error);
            throw new Error("Image upload failed.");
        }

        console.log("Image uploaded:", imageData?.path); // Log the uploaded image path
        imageUrls.push(imageData?.path);
    }

    // Create a new product
    console.log("Creating product with the following data:");
    console.log({
        name,
        description,
        price,
        stockQuantity,
        estimatedArrivalTime,
        sizes,
        imageUrls,
        isNew,
        isFeatured,
        isTrending,
        isShipped,
        categoryId,
        collectionId,
        professionalId,
    });

    await prisma.product.create({
        data: {
            name,
            description,
            price,
            stockQuantity,
            sizes,
            isNew: true,
            isFeatured,
            estimatedArrivalTime,
            isTrending,
            isShipped,
            imageUrl: imageUrls,
            categoryId,
            collectionId,
            professionalId, // Associate product with the logged-in professional
        },
    });

    console.log("Product created successfully.");
}
