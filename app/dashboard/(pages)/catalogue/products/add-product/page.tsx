'use client';
import React, { useEffect, useState } from "react";
import { CreateProduct } from "@/app/api/POST/Products/action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type SizeOption = "2" | "4" | "6" | "8" | "10" | "12" | "14" | "16" | "34" | "36" | "38" | "40" | "42" | "44" | "46" | "48" | "6" | "8" | "10" | "12" | "14" | "16" | "18" | "20" | "XS" | "S" | "M" | "L" | "XL" | "XXL";

function AddProductPage() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([]);
  const [denomination, setDenomination] = useState<"US" | "EU" | "UK" | "General">("US");
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const sizeOptions = {
    US: ["2", "4", "6", "8", "10", "12", "14", "16"] as SizeOption[],
    EU: ["34", "36", "38", "40", "42", "44", "46", "48"] as SizeOption[],
    UK: ["6", "8", "10", "12", "14", "16", "18", "20"] as SizeOption[],
    General: ["XS", "S", "M", "L", "XL", "XXL"] as SizeOption[],
  };

  useEffect(() => {
    // Fetch categories and collections
    const fetchCategories = async () => {
      const res = await fetch("/api/GET/getProductCategories");
      const data = await res.json();
      setCategories(data);
    };

    const fetchCollections = async () => {
      const res = await fetch("/api/GET/getCollections");
      const data = await res.json();
      setCollections(data);
    };

    fetchCategories();
    fetchCollections();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageUrls = files.map((file) => URL.createObjectURL(file as File));
    setSelectedImages((prev) => [...prev, ...imageUrls]);
  };

  const handleSizeSelection = (size: SizeOption) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
        <form action={CreateProduct}>
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">General Information</h2>
              <label className="block mb-2 text-sm font-medium">Name Product</label>
              <input
                type="text"
                name="name"
                placeholder="Puffer Jacket With Pocket Detail"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
              <label className="block mb-2 text-sm font-medium">Description Product</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Cropped puffer jacket made of technical fabric. High neck and long sleeves..."
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              ></textarea>
            </div>

            {/* Upload Images */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Upload Images</h2>
              <div className="border border-gray-300 rounded-md p-4 flex flex-col items-center">
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                />
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Uploaded ${index + 1}`}
                      className="w-12 h-12 object-cover border border-gray-300 rounded-md"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
  <h2 className="text-lg font-semibold mb-3">Available Sizes</h2>
  
  {/* Select Denomination */}
  <div className="mb-4">
    <label className="block mb-2 text-sm font-medium">Select Denomination</label>
    <Select name="denomination" value={denomination} onValueChange={(value) => setDenomination(value as "US" | "EU" | "UK" | "General")} required>
      <SelectTrigger className="w-full border border-gray-300 rounded-md p-2">
        <SelectValue placeholder="Select Denomination" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="US">US</SelectItem>
        <SelectItem value="EU">EU</SelectItem>
        <SelectItem value="UK">UK</SelectItem>
        <SelectItem value="General">General</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Size Options */}
  <div className="flex flex-wrap gap-4">
    {sizeOptions[denomination].map((size) => (
      <label key={size} className="flex items-center gap-2">
        <Checkbox
          name="sizes"
          checked={selectedSizes.includes(size)}
          onCheckedChange={() => handleSizeSelection(size)}
        />
        <span>{denomination === "General" ? size : `${denomination} ${size}`}</span>
      </label>
    ))}
  </div>
</div>


          {/* Category and Collection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  <div>
    <h2 className="text-lg font-semibold mb-3">Category & Collection</h2>
    
    {/* Product Category */}
    <label className="block mb-2 text-sm font-medium">Product Category</label>
    <Select name="categoryId" value={selectedCategory} onValueChange={setSelectedCategory} required>
      <SelectTrigger className="w-full border border-gray-300 rounded-md p-2">
        <SelectValue placeholder="Select Category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Product Collection */}
    <label className="block mb-2 text-sm font-medium mt-4">Product Collection</label>
    <Select name="collectionId" value={selectedCollection} onValueChange={setSelectedCollection} required>
      <SelectTrigger className="w-full border border-gray-300 rounded-md p-2">
        <SelectValue placeholder="Select Collection" />
      </SelectTrigger>
      <SelectContent>
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            {collection.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>


          {/* Pricing and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Pricing And Stock</h2>
              <label className="block mb-2 text-sm font-medium">Base Pricing</label>
              <input
                type="number"
                name="price"
                placeholder="47.55"
                step="0.01"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
              <label className="block mb-2 text-sm font-medium">Stock</label>
              <input
                type="number"
                name="stockQuantity"
                placeholder="77"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;
