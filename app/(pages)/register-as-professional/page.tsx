"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/app/components/LocationPicker";


interface SocialMedia {
  platform: string;
  url: string;
}

interface ProfessionalType {
  id: string;
  name: string;
  description?: string;
}

export default function RegisterProfessionalForm() {
  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    experience: 0,
    bio: "",
    portfolioUrl: "",
    spotlightVideoUrl: "",
    availability: "",
    freeDeliveryThreshold: 0,
  });

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([{ platform: "", url: "" }]);
  const [businessImage, setBusinessImage] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [professionalTypes, setProfessionalTypes] = useState<ProfessionalType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");

  // Fetch professional types
  useEffect(() => {
    const fetchProfessionalTypes = async () => {
      try {
        const response = await fetch('/api/professional-types');
        if (response.ok) {
          const types = await response.json();
          setProfessionalTypes(types);
        }
      } catch (error) {
        console.error('Error fetching professional types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProfessionalTypes();
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'images');
      formData.append('folder', 'business-images');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const updateSocialMedia = (index: number, field: keyof SocialMedia, value: string) => {
    const updated = [...socialMedia];
    updated[index] = { ...updated[index], [field]: value };
    setSocialMedia(updated);
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationAddress(address);
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.businessName.trim()) {
        alert('Business name is required');
        setCurrentStep(1);
        return;
      }

      if (!selectedSpecialization) {
        alert('Please select a specialization');
        setCurrentStep(1);
        return;
      }

      let businessImageUrl = "";
      if (businessImage) {
        businessImageUrl = await handleImageUpload(businessImage);
      }

      const profileData = {
        businessName: formData.businessName,
        businessImage: businessImageUrl,
        specializationId: selectedSpecialization,
        experience: formData.experience,
        bio: formData.bio || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        spotlightVideoUrl: formData.spotlightVideoUrl || undefined,
        latitude,
        longitude,
        location: locationAddress,
        availability: formData.availability || undefined,
        freeDeliveryThreshold: formData.freeDeliveryThreshold || undefined,
        socialMedia: socialMedia.filter(sm => sm.platform && sm.url).map(sm => ({
          platform: sm.platform.toUpperCase(),
          url: sm.url
        }))
      };

      const response = await fetch('/api/professional-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create professional profile');
      }

      const result = await response.json();
      console.log('Professional profile saved:', result);
      const isUpdate = response.status === 200;
      alert(`Professional profile ${isUpdate ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Interactive Mouse Follower */}
      <div 
        className="fixed w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-300 ease-out z-0"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
        }}
      ></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Sidebar - Brand Section */}
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-center p-12 backdrop-blur-xl bg-black/20 border-r border-white/10">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  T
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  trendizip
                </span>
              </div>
              <h1 className="text-5xl font-extrabold text-white leading-tight">
                Elevate Your
                <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                  Fashion Empire
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join the revolution of fashion professionals who&apos;ve transformed their businesses with our cutting-edge platform.
              </p>
            </div>

            {/* Testimonial Cards */}
            <div className="space-y-6">
              <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Amara Chen</h3>
                    <p className="text-gray-400 text-sm">Fashion Designer</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  &quot;My revenue increased by 300% in just 6 months. The analytics and client management tools are game-changing!&quot;
                </p>
                <div className="flex text-yellow-400 mt-3">
                  {'★'.repeat(5)}
                </div>
              </div>

              <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Marcus Johnson</h3>
                    <p className="text-gray-400 text-sm">Boutique Owner</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  &quot;The platform&apos;s design is stunning and the features are exactly what I needed to scale my business.&quot;
                </p>
                <div className="flex text-yellow-400 mt-3">
                  {'★'.repeat(5)}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-gray-400 text-sm">Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">$2M+</div>
                <div className="text-gray-400 text-sm">Revenue Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-gray-400 text-sm">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Form Container with Glassmorphism */}
            <div className="backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-2 bg-black/20">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 2) * 100}%` }}
                ></div>
              </div>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentStep === 1 && "Basic Information"}
                    {currentStep === 2 && "Business Details"}
                  </h2>
                  <p className="text-gray-300">
                    Step {currentStep} of 2 - Let&apos;s build your professional profile
                  </p>
                </div>

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="text-white font-medium">Business Name *</Label>
                          <Input
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                            placeholder="Your fashion brand name"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                            required
                          />
                        </div>
                      </div>

                      <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        location={locationAddress}
                        onLocationChange={handleLocationChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-white font-medium">Specialization *</Label>
                      <Select
                        name="specialization"
                        value={selectedSpecialization}
                        onValueChange={setSelectedSpecialization}
                        required
                        disabled={loadingTypes}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl h-12">
                          <SelectValue placeholder={loadingTypes ? "Loading specializations..." : "Choose your specialization"} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          {professionalTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="text-white hover:bg-gray-800">
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-white font-medium">Years of Experience *</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        value={formData.experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                        placeholder="How many years of experience do you have?"
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessImage" className="text-white font-medium">Business Image</Label>
                      <div className="relative">
                        <Input
                          id="businessImage"
                          name="businessImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBusinessImage(e.target.files?.[0] || null)}
                          className="bg-white/10 border-white/20 text-white file:bg-gradient-to-r file:from-pink-500 file:to-purple-500 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Details */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-white font-medium">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about your expertise, style, and what makes you unique in the fashion industry..."
                        rows={4}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl" className="text-white font-medium">Portfolio URL</Label>
                        <Input
                          id="portfolioUrl"
                          name="portfolioUrl"
                          type="url"
                          value={formData.portfolioUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                          placeholder="https://yourportfolio.com"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spotlightVideoUrl" className="text-white font-medium">Video URL</Label>
                        <Input
                          id="spotlightVideoUrl"
                          name="spotlightVideoUrl"
                          type="url"
                          value={formData.spotlightVideoUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, spotlightVideoUrl: e.target.value }))}
                          placeholder="https://youtube.com/watch?v=..."
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                        />
                      </div>
                    </div>

                    {/* Advanced Options - Collapsible */}
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="border-white/20 text-white hover:bg-white/10 rounded-xl w-full"
                      >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                      </Button>

                      {showAdvanced && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          <div className="space-y-2">
                            <Label htmlFor="availability" className="text-white font-medium">Availability</Label>
                            <Textarea
                              id="availability"
                              name="availability"
                              value={formData.availability}
                              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                              placeholder="e.g., Monday to Friday, 9 AM - 6 PM"
                              rows={2}
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl resize-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="freeDeliveryThreshold" className="text-white font-medium">Free Delivery Threshold (KES)</Label>
                            <Input
                              id="freeDeliveryThreshold"
                              name="freeDeliveryThreshold"
                              type="number"
                              min="0"
                              value={formData.freeDeliveryThreshold}
                              onChange={(e) => setFormData(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || 0 }))}
                              placeholder="5000"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12"
                            />
                          </div>

                          {/* Social Media - Simplified */}
                          <div className="space-y-2">
                            <Label className="text-white font-medium">Social Media (Optional)</Label>
                            {socialMedia.slice(0, 2).map((social, index) => (
                              <div key={index} className="grid grid-cols-2 gap-2">
                                <Select
                                  value={social.platform}
                                  onValueChange={(value) => updateSocialMedia(index, 'platform', value)}
                                >
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg h-10">
                                    <SelectValue placeholder="Platform" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-gray-700">
                                    <SelectItem value="INSTAGRAM" className="text-white hover:bg-gray-800">Instagram</SelectItem>
                                    <SelectItem value="FACEBOOK" className="text-white hover:bg-gray-800">Facebook</SelectItem>
                                    <SelectItem value="TIKTOK" className="text-white hover:bg-gray-800">TikTok</SelectItem>
                                    <SelectItem value="YOUTUBE" className="text-white hover:bg-gray-800">YouTube</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="url"
                                  placeholder="Profile URL"
                                  value={social.url}
                                  onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-lg h-10"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-white/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-8"
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 2 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl px-8 transform hover:scale-105 transition-all duration-200"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl px-8 transform hover:scale-105 transition-all duration-200"
                    >
                      Create Profile ✨
                    </Button>
                  )}
                </div>

                {/* Login Link */}
                <p className="text-center text-gray-400 mt-6">
                  Already have an account?{" "}
                  <a href="#" className="text-pink-400 hover:text-pink-300 underline font-medium">
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}