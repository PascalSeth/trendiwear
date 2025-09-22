"use client";

import { useState } from "react";
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

export default function TrendCategorySheet() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;

    if (!name || !image) {
      setError("Name and image are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/GET/getTrendCategories", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const newCategory = await response.json();
      console.log("Category created:", newCategory);

      // Close the sheet or reset form
      // You can add logic to refresh the data table here
    } catch (error) {
      console.error("Error creating category:", error);
      setError(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Add Trend Category</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Trend Category</SheetTitle>
          <SheetDescription>
            Enter the details of the Trend category below.
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

            {error && (
              <div className="col-span-4 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
