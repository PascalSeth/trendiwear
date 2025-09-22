'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category{
  id: string;
  name: string;
  parentId?: string;
}
export default function TrendsubCategorySheet() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/GET/getTrendCategories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        // Filter for top-level categories (no parent)
        const topLevelCategories = data.filter((cat: Category) => !cat.parentId);
        setCategories(topLevelCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const categoryId = formData.get("categoryId") as string;

    if (!name || !image || !categoryId) {
      setError("All fields are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/GET/getTrendCategories", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create sub-category");
      }

      const newCategory = await response.json();
      console.log("Sub-category created:", newCategory);

      // Close the sheet or reset form
      // You can add logic to refresh the data table here
    } catch (error) {
      console.error("Error creating sub-category:", error);
      setError(error instanceof Error ? error.message : "Failed to create sub-category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Add Trend Sub-Category</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Trend Sub-Category</SheetTitle>
          <SheetDescription>
            Enter the details of the Trend sub-category below.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter Trend name"
                className="col-span-3"
                required
              />
            </div>

            {/* Image Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image *
              </Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="col-span-3"
                required
              />
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Category *
              </Label>
              <Select name="categoryId" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent className="z-[999]">
                  <SelectGroup>
                    <SelectLabel>Categories</SelectLabel>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="col-span-4 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Sub-Category"}
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
