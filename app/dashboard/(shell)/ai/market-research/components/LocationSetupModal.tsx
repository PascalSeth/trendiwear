"use client";

import React, { useState } from "react";
import { X, MapPin, Check, Globe } from "lucide-react";
import { RadarLocation } from "@/lib/ai/market-radar/types";

interface LocationSetupModalProps {
  currentLocation: RadarLocation;
  onSave: (loc: RadarLocation) => void;
  onClose: () => void;
}

const PRESET_LOCATIONS: RadarLocation[] = [
  {
    city: "Accra",
    region: "Greater Accra",
    country: "Ghana",
    countryCode: "GH",
    timezone: "Africa/Accra",
    currency: "GH₵",
  },
  {
    city: "Kumasi",
    region: "Ashanti",
    country: "Ghana",
    countryCode: "GH",
    timezone: "Africa/Accra",
    currency: "GH₵",
  },
  {
    city: "Lagos",
    region: "Lagos State",
    country: "Nigeria",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    currency: "₦",
  },
  {
    city: "Abuja",
    region: "FCT",
    country: "Nigeria",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    currency: "₦",
  },
  {
    city: "London",
    region: "Greater London",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    currency: "£",
  },
  {
    city: "New York",
    region: "New York",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    currency: "$",
  },
];

export function LocationSetupModal({
  currentLocation,
  onSave,
  onClose,
}: LocationSetupModalProps) {
  const [city, setCity] = useState(currentLocation.city);
  const [country, setCountry] = useState(currentLocation.country);
  const [currency, setCurrency] = useState(currentLocation.currency);

  const handleSelectPreset = (preset: RadarLocation) => {
    onSave(preset);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim()) return;

    const countryCode = country.toLowerCase() === "ghana" ? "GH" : country.toLowerCase() === "nigeria" ? "NG" : "US";
    const timezone = countryCode === "GH" ? "Africa/Accra" : countryCode === "NG" ? "Africa/Lagos" : "UTC";

    onSave({
      city: city.trim(),
      region: "",
      country: country.trim(),
      countryCode,
      timezone,
      currency: currency.trim() || (countryCode === "GH" ? "GH₵" : countryCode === "NG" ? "₦" : "$"),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Target Selling Market</h3>
              <p className="text-[11px] text-muted-foreground">Select your primary retail location</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Popular African & Global Hubs
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected =
                  loc.city.toLowerCase() === currentLocation.city.toLowerCase() &&
                  loc.country.toLowerCase() === currentLocation.country.toLowerCase();
                return (
                  <button
                    key={`${loc.city}-${loc.country}`}
                    type="button"
                    onClick={() => handleSelectPreset(loc)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/70 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{loc.city}</div>
                      <div className="text-[10px] text-muted-foreground">{loc.country} ({loc.currency})</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Location Form */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-border/60 space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Or Specify Custom City
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Takoradi"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Ghana"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                Apply Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

