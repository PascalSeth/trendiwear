'use client';
import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type SizeOption =
  | "US 2" | "US 4" | "US 6" | "US 8" | "US 10" | "US 12" | "US 14" | "US 16"
  | "EU 34" | "EU 36" | "EU 38" | "EU 40" | "EU 42" | "EU 44" | "EU 46" | "EU 48"
  | "UK 6" | "UK 8" | "UK 10" | "UK 12" | "UK 14" | "UK 16" | "UK 18" | "UK 20"
  | "XS" | "S" | "M" | "L" | "XL" | "XXL";
function AddProductPage() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([]);
  const [denomination, setDenomination] = useState<"US" | "EU" | "UK" | "General">("US");
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isNew, setIsNew] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isTrending, setIsTrending] = useState<boolean>(false);
  const [isShipped, setIsShipped] = useState<boolean>(false); 

const sizeOptions = {
  US: ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16"] as SizeOption[],
  EU: ["EU 34", "EU 36", "EU 38", "EU 40", "EU 42", "EU 44", "EU 46", "EU 48"] as SizeOption[],
  UK: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"] as SizeOption[],
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
        <form>
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
  <input type="hidden" name="sizes" value={JSON.stringify(selectedSizes)} />

<div className="flex flex-wrap gap-4">
  {sizeOptions[denomination].map((size) => (
    <label key={size} className="flex items-center gap-2">
      <Checkbox
        checked={selectedSizes.includes(size)}
        onCheckedChange={() => handleSizeSelection(size)}
      />
      <span> {size}</span>
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
                          
{!isShipped && (
  <div>


              <label className="block mb-2 text-sm font-medium">Stock</label>
              <input
                type="number"
                name="stockQuantity"
                placeholder="77"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />
                </div>)}
            </div>
          </div>

          {/* Shipping Checkbox and Estimated Arrival */}
          <div className="mb-6">
          <label className="flex items-center gap-2">
    <Checkbox
      checked={isShipped}
      onCheckedChange={() => setIsShipped((prev) => !prev)}
    />
    <input type="hidden" name="isShipped" value={isShipped.toString()} />
    <span>Is Shipped</span>
  </label>

            {isShipped && (
              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium">Estimated Arrival (in days)</label>
                <input
                  type="number"
                  name="estimatedArrivalTime"
                  placeholder="Estimated arrival in days"
                  className="w-full border border-gray-300 rounded-md p-2"
                  min={1}
                />
              </div>
            )}
          </div>

{/* Boolean Fields */}
<div className="mb-6 hidden">
  <h2 className="text-lg font-semibold mb-3">Product Status</h2>
  <label className="flex items-center gap-2">
    <Checkbox
      checked={isNew}
      onCheckedChange={() => setIsNew((prev) => !prev)}
    />
    <input type="hidden" name="isNew" value={isNew.toString()} />
    <span>Is New</span>
  </label>
  <label className="flex items-center gap-2 mt-2">
    <Checkbox
      checked={isFeatured}
      onCheckedChange={() => setIsFeatured((prev) => !prev)}
    />
    <input type="hidden" name="isFeatured" value={isFeatured.toString()} />
    <span>Is Featured</span>
  </label>
  <label className="flex items-center gap-2 mt-2">
    <Checkbox
      checked={isTrending}
      onCheckedChange={() => setIsTrending((prev) => !prev)}
    />
    <input type="hidden" name="isTrending" value={isTrending.toString()} />
    <span>Is Trending</span>
  </label>
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
