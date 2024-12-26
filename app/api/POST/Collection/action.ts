"use server";

import prisma from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function CreateCollection(formData: FormData){
    const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File;
  const categoryId= formData.get('categoryId') as string;

  if (imageFile) {
    const { data: imageData, error } = await supabase.storage
      .from("images")
      .upload(`collections/${imageFile.name}-${Date.now()}`, imageFile, {
        cacheControl: "2592000",
        contentType: imageFile.type,
      });

    if (error) {
      console.error("Error uploading image: ", error);
      return;
    }

    await prisma.collection.create({
      data: {
        name,
        imageUrl: imageData?.path,
        categoryId,
      },
    });
  }
}
