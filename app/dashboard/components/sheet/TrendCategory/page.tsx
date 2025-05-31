"use client";

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
        <form >
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
