'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
// import Link from 'next/link';
import { Eye, Edit, Trash2, Star, MapPin, Calendar, DollarSign, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Professional {
  id: string;
  userId: string;
  businessName: string;
  businessImage: string | null;
  specialization: {
    name: string;
  } | null;
  experience: number;
  location: string;
  isVerified: boolean;
  rating: number | null;
  totalReviews: number;
  completedOrders: number;
  accountBalance: number;
  creditScore: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    _count: {
      professionalServices: number;
      products: number;
    };
  };
}

const ProfessionalsPage = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [filter] = useState('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professional-profiles?limit=1000'); // Get all for dashboard
      if (response.ok) {
        const data = await response.json();
        setProfessionals(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load professionals');
      }
    } catch {
      setError('Failed to load professionals');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (professional: Professional) => {
    setVerifyingId(professional.id);
    
    try {
      const response = await fetch(`/api/professional-profiles/${professional.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !professional.isVerified }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setProfessionals(prev => 
          prev.map(p => p.id === professional.id ? { ...p, isVerified: data.isVerified } : p)
        );
        toast.success(data.isVerified ? `${professional.businessName} has been verified!` : `Verification removed from ${professional.businessName}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update verification');
      }
    } catch {
      toast.error('Failed to update verification status');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    if (filter === 'all') return true;
    if (filter === 'verified') return prof.isVerified;
    if (filter === 'unverified') return !prof.isVerified;
    if (filter === 'sellers') return prof.user._count.products > 0;
    if (filter === 'service-providers') return prof.user._count.professionalServices > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading professionals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Vendor &amp; Stylist Network</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Professionals &amp; Vendors
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage stylist profiles, vendor verifications, credit ratings, and merchant services.
          </p>
        </div>
      </div>

      {/* STATS CARDS - 2x2 on mobile, 4 cols on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Total Professionals", value: professionals.length, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Verified Merchants", value: professionals.filter(p => p.isVerified).length, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Services", value: professionals.reduce((sum, p) => sum + p.user._count.professionalServices, 0), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Products", value: professionals.reduce((sum, p) => sum + p.user._count.products, 0), icon: MapPin, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-indigo-300 transition-all">
            <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Professionals Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Registered Professionals ({filteredProfessionals.length})
          </h3>
        </div>

        {filteredProfessionals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No professionals found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Professional
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Type
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Rating
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Services / Products
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredProfessionals.map((professional) => (
                  <tr key={professional.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <Image
                            className="h-8 w-8 rounded-lg object-cover border border-slate-200"
                            src={professional.businessImage || '/beccaProfile.jpg'}
                            alt={professional.businessName}
                            width={32}
                            height={32}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-semibold text-slate-900">
                            {professional.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {professional.user.firstName} {professional.user.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" />
                            {professional.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-900">
                        {professional.specialization?.name || 'General'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {professional.experience} yrs exp
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-400 mr-1 fill-amber-400" />
                        <span className="text-xs font-semibold text-slate-900">
                          {professional.rating?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({professional.totalReviews})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Credit: {professional.creditScore}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <div className="text-xs text-slate-800">
                        {professional.user._count.professionalServices} services
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {professional.user._count.products} products
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center w-fit ${
                        professional.isVerified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {professional.isVerified ? (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Verify/Unverify Button */}
                        <button
                          onClick={() => handleToggleVerification(professional)}
                          disabled={verifyingId === professional.id}
                          className={`p-1 rounded-md transition-colors ${
                            professional.isVerified
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          } disabled:opacity-50`}
                          title={professional.isVerified ? 'Remove verification' : 'Verify professional'}
                        >
                          {verifyingId === professional.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : professional.isVerified ? (
                            <ShieldX className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button className="text-slate-500 hover:text-indigo-600 p-1">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-slate-500 hover:text-emerald-600 p-1">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button className="text-slate-500 hover:text-red-600 p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalsPage;