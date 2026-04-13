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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Rider Management</h1>
          <p className="text-slate-500">Manage your delivery fleet and assign them to orders.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200 transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Add Professional Rider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddRider}>
              <DialogHeader>
                <DialogTitle>Add New Rider</DialogTitle>
                <DialogDescription>
                  Enter the rider&apos;s professional details. They will appear in your fulfillment list.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <Input 
                    placeholder="e.g. Samuel Amponsah" 
                    value={newRider.name}
                    onChange={e => setNewRider({...newRider, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                  <Input 
                    placeholder="024 XXX XXXX" 
                    value={newRider.phone}
                    onChange={e => setNewRider({...newRider, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Vehicle</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newRider.vehicleType || "bike"}
                      onChange={e => setNewRider({...newRider, vehicleType: e.target.value})}
                    >
                      <option value="bike">Motorbike</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">License ID</label>
                    <Input 
                      placeholder="Optional" 
                      value={newRider.licenseNumber || ""}
                      onChange={e => setNewRider({...newRider, licenseNumber: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                  Register Rider
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Riders</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black">{riders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Fleet</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black">{riders.filter(r => r.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or phone..." 
              className="pl-10 h-11 bg-slate-50/50 border-none rounded-xl"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        </div>
      ) : filteredRiders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRiders.map((rider) => (
            <div key={rider.id} className="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-violet-100 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                  <Truck className="w-6 h-6 text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={rider.isActive ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-slate-50 text-slate-600"}>
                    {rider.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600"
                    onClick={() => deleteRider(rider.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{rider.name}</h3>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {rider.phone}
                  </div>
                  {rider.vehicleType && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Car className="w-4 h-4 text-slate-400" />
                      <span className="capitalize">{rider.vehicleType}</span>
                    </div>
                  )}
                  {rider.licenseNumber && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Hash className="w-4 h-4 text-slate-400" />
                      ID: {rider.licenseNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl text-xs font-bold uppercase tracking-widest h-9"
                  onClick={() => toggleRiderStatus(rider.id, rider.isActive)}
                >
                  {rider.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No Professional Riders Yet</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            Register your delivery fleet to start assigning them to customer orders professionally.
          </p>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 rounded-2xl shadow-xl shadow-violet-200"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Rider
          </Button>
        </div>
      )}
    </div>
  );
}
