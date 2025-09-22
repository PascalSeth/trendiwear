'use client'

import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
import { Eye, Edit, Trash2, Star, MapPin, Calendar, DollarSign } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professional-profiles?limit=1000'); // Get all for dashboard
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data.profiles || []);
      } else {
        setError('Failed to load professionals');
      }
    } catch {
      setError('Failed to load professionals');
    } finally {
      setLoading(false);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professional Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all professionals on the platform</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'verified', label: 'Verified' },
              { value: 'unverified', label: 'Unverified' },
              { value: 'sellers', label: 'Sellers' },
              { value: 'service-providers', label: 'Service Providers' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === option.value
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Professionals</p>
              <p className="text-2xl font-bold text-gray-900">{professionals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.filter(p => p.isVerified).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.reduce((sum, p) => sum + p.user._count.professionalServices, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {professionals.reduce((sum, p) => sum + p.user._count.products, 0)}
              </p>
            </div>
          </div>
        </div>
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
            <table className="min-w-full divide-y divide-gray-200">
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
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={professional.businessImage || '/beccaProfile.jpg'}
                            alt={professional.businessName}
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
                        {professional.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
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