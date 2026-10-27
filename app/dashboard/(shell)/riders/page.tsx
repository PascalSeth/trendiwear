"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Truck, Phone, Hash, Car, 
  Trash2, Loader2, Search,
  CheckCircle2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Rider {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  vehicleType: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newRider, setNewRider] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    vehicleType: "bike",
  });

  const fetchRiders = async () => {
    try {
      const res = await fetch("/api/riders");
      if (res.ok) {
        const data = await res.json();
        setRiders(data.riders);
      }
    } catch (error) {
      console.error("Failed to fetch riders:", error);
      toast.error("Failed to load riders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRider),
      });

      if (res.ok) {
        toast.success("Rider added successfully");
        setIsAddDialogOpen(false);
        setNewRider({ name: "", phone: "", licenseNumber: "", vehicleType: "bike" });
        fetchRiders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add rider");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRiderStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/riders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setRiders(riders.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
        toast.success(`Rider ${!currentStatus ? 'activated' : 'deactivated'}`);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteRider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rider?")) return;
    
    try {
      const res = await fetch(`/api/riders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRiders(riders.filter(r => r.id !== id));
        toast.success("Rider deleted");
      }
    } catch {
      toast.error("Failed to delete rider");
    }
  };

  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Fleet &amp; Dispatch</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Rider Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage delivery personnel and assign dispatch to customer orders.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all gap-1.5 self-start sm:self-auto">
              <Plus className="w-3.5 h-3.5" />
              Add Delivery Rider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddRider}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Add Delivery Rider</DialogTitle>
                <DialogDescription className="text-xs">
                  Enter rider contact and vehicle details for order dispatch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <Input 
                    placeholder="e.g. Samuel Amponsah" 
                    value={newRider.name}
                    onChange={e => setNewRider({...newRider, name: e.target.value})}
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                  <Input 
                    placeholder="024 XXX XXXX" 
                    value={newRider.phone}
                    onChange={e => setNewRider({...newRider, phone: e.target.value})}
                    required
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vehicle</label>
                    <select 
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs"
                      value={newRider.vehicleType || "bike"}
                      onChange={e => setNewRider({...newRider, vehicleType: e.target.value})}
                    >
                      <option value="bike">Motorbike</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">License ID</label>
                    <Input 
                      placeholder="Optional" 
                      value={newRider.licenseNumber || ""}
                      onChange={e => setNewRider({...newRider, licenseNumber: e.target.value})}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)} className="h-8 text-xs rounded-lg">Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Truck className="w-3.5 h-3.5 mr-1.5" />}
                  Register Rider
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Riders</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{riders.length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Fleet</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{riders.filter(r => r.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
              placeholder="Search by name or phone..." 
              className="pl-8 h-9 bg-slate-50/50 border-slate-200 rounded-lg text-xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : filteredRiders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {filteredRiders.map((rider) => (
            <div key={rider.id} className="group relative bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-xs hover:border-violet-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                  <Truck className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={rider.isActive ? "bg-teal-50 text-teal-700 border-teal-200 text-[10px] px-1.5 py-0" : "bg-slate-50 text-slate-600 text-[10px] px-1.5 py-0"}>
                    {rider.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600"
                    onClick={() => deleteRider(rider.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">{rider.name}</h3>
                <div className="space-y-1.5 mt-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {rider.phone}
                  </div>
                  {rider.vehicleType && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="capitalize">{rider.vehicleType}</span>
                    </div>
                  )}
                  {rider.licenseNumber && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ID: {rider.licenseNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5">
                <Button 
                  variant="outline" 
                  className="w-full rounded-lg text-xs font-semibold h-8 border-slate-200 hover:bg-slate-50"
                  onClick={() => toggleRiderStatus(rider.id, rider.isActive)}
                >
                  {rider.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <Truck className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">No Delivery Riders Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Register your delivery fleet to start assigning them to customer orders.
          </p>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 h-8 text-xs rounded-lg shadow-xs"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Rider
          </Button>
        </div>
      )}
    </div>
  );
}
