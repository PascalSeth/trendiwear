"use client";

import { CreateProductCategory } from "@/app/api/POST/ProductCategory/action";
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

export default function ProductCategorySheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Add Product Category</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Product Category</SheetTitle>
          <SheetDescription>
            Enter the details of the Product category below.
          </SheetDescription>
        </SheetHeader>
        <form action={CreateProductCategory}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter Category name"
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

             
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Save Category</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
