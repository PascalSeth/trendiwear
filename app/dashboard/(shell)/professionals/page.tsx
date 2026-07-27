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
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Vendor &amp; Stylist Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Professionals &amp; Vendors
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage stylist profiles, vendor verifications, credit ratings, and merchant services.
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Professionals", value: professionals.length, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Verified Merchants", value: professionals.filter(p => p.isVerified).length, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Services", value: professionals.reduce((sum, p) => sum + p.user._count.professionalServices, 0), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Products", value: professionals.reduce((sum, p) => sum + p.user._count.products, 0), icon: MapPin, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-300 transition-all">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Professionals Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Professionals ({filteredProfessionals.length})
          </h3>
        </div>

        {filteredProfessionals.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No professionals found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services/Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfessionals.map((professional) => (
                  <tr key={professional.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={professional.businessImage || '/beccaProfile.jpg'}
                            alt={professional.businessName}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {professional.businessName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {professional.user.firstName} {professional.user.lastName}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {professional.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {professional.specialization?.name || 'Not specified'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {professional.experience} years exp.
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {professional.rating?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({professional.totalReviews})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Credit: {professional.creditScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {professional.user._count.professionalServices} services
                      </div>
                      <div className="text-sm text-gray-500">
                        {professional.user._count.products} products
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${
                        professional.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {professional.isVerified ? (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Verify/Unverify Button */}
                        <button
                          onClick={() => handleToggleVerification(professional)}
                          disabled={verifyingId === professional.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            professional.isVerified
                              ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                              : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                          } disabled:opacity-50`}
                          title={professional.isVerified ? 'Remove verification' : 'Verify professional'}
                        >
                          {verifyingId === professional.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : professional.isVerified ? (
                            <ShieldX className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
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