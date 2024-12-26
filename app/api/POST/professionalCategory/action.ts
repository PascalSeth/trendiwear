"use server";

import prisma from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function CreateProfessionalCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageFile = formData.get('image') as File;

  if (imageFile) {
    const { data: imageData, error } = await supabase.storage
      .from("images")
      .upload(`professionalCategories/${imageFile.name}-${Date.now()}`, imageFile, {
        cacheControl: "2592000",
        contentType: imageFile.type,
      });

    if (error) {
      console.error("Error uploading image: ", error);
      return;
    }

    await prisma.professionCategory.create({
      data: {
        name,
        description,
        imageUrl: imageData?.path,
      },
    });
  }
}
