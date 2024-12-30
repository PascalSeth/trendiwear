"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegisterProfessionalAction } from "@/app/api/POST/RegisterUser/action";

export default function RegisterProfessionalForm() {
  const [hasStore, setHasStore] = useState(false);
  const [professionalCategories, setProfessionalCategories] = useState<any[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // Fetch professional categories from the API on mount
  useEffect(() => {
    const fetchProfessionalCategories = async () => {
      try {
        const response = await fetch("/api/GET/getProfessionalCategories");
        const data = await response.json();
        setProfessionalCategories(data); // Assuming the API returns a list of categories
      } catch (error) {
        console.error("Error fetching professional categories:", error);
      }
    };
    fetchProfessionalCategories();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Left Section */}
        <div className="flex flex-col justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-10 space-y-8">
          <h1 className="text-4xl font-bold">Transform Your Fashion Business</h1>
          <p className="text-lg">
            Unlock the power of TrendiWear's cutting-edge dashboard. Track your sales, analyze trends, and watch your profits soar. Your next big success starts here!
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg shadow-md">
              <p className="italic">
                "Since joining TrendiWear, my sales have skyrocketed, and the insights are unmatched. Don’t wait to take your business to the next level!"
              </p>
              <p className="mt-4 text-sm font-semibold">- Taylor Monroe</p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10">
          <h2 className="text-2xl font-bold mb-6">Create an account</h2>
          <form
            action={RegisterProfessionalAction}
            method="POST"
            encType="multipart/form-data"
          >
            <div className="space-y-6">

              {/* Business Name Field */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="Enter your business name"
                  required
                />
              </div>

              {/* Business or Individual Field */}
              <div>
                <Label>Business or Individual</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Checkbox id="isBusiness" name="isBusiness" value="true" />
                    <Label htmlFor="isBusiness" className="ml-2">
                      Business
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="isIndividual" name="isBusiness" value="false" />
                    <Label htmlFor="isIndividual" className="ml-2">
                      Individual
                    </Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                   Location *
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter your store location"
                  className="col-span-3"
                  required
                />
              </div>
              {/* Store Information */}
              <div>
                <Label>Do you have a store?</Label>
                <Checkbox
                  id="hasStore"
                  name="hasStore"
                  value="true"
                  checked={hasStore}
                  onCheckedChange={() => setHasStore((prev) => !prev)}
                />
              </div>

              {hasStore && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      name="storeName"
                      placeholder="Enter your store name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Working Hours *</Label>
                    <Textarea
                      id="workingHours"
                      name="workingHours"
                      placeholder="Enter your store working hours"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeLocation">Store Location *</Label>
                    <Input
                      id="storeLocation"
                      name="storeLocation"
                      placeholder="Enter your store location"
                      required
                    />
                  </div>
                </>
              )}

              {/* Professional Category */}
              <div className="space-y-2">
                <Label htmlFor="professionId">Professional Category *</Label>
                <Select
                  name="professionId"
                  value={selectedProfessionalId || ""}
                  onValueChange={(value) => setSelectedProfessionalId(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a professional category" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionalCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Register
              </Button>
            </div>
          </form>
          <p className="mt-6 text-sm text-center">
            Already have an account?{" "}
            <a href="#" className="text-blue-600 underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
