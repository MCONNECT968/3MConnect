import React, { useState } from 'react';
import { Plus, Search, Filter, ArrowDownUp, Users, Target, CheckCircle, Clock, AlertCircle, Eye, Edit, Trash2, Phone, Mail, MessageCircle, Archive, Check } from 'lucide-react';
import NeedsForm from '../components/forms/NeedsForm';
import PropertyDetails from '../components/property/PropertyDetails';
import { ClientNeeds, Client, Property, UrgencyLevel, PropertyType, TransactionType } from '../types';
import { clients, properties } from '../data/mockData';

interface NeedsRequest extends ClientNeeds {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: 'active' | 'matched' | 'closed' | 'archived';
  matchedProperties: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NeedsForms: React.FC = () => {
  // Convert existing client needs to requests format
  const initialRequests: NeedsRequest[] = clients
    .filter(client => client.needs)
    .map(client => ({
      ...client.needs!,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      status: 'active' as const,
      matchedProperties: [],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

  const [requests, setRequests] = useState<NeedsRequest[]>(initialRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<NeedsRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<NeedsRequest | null>(null);
  const [selectedClientForForm, setSelectedClientForForm] = useState<Client | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    propertyType: '',
    priceRange: '',
    location: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    let filteredRequests = [...initialRequests];

    if (searchTerm) {
      filteredRequests = filteredRequests.filter(
        (request) =>
          request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.clientPhone.includes(searchTerm) ||
          request.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.locations.some(loc => loc.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.status) {
      filteredRequests = filteredRequests.filter(
        (request) => request.status === filters.status
      );
    }

    if (filters.urgency) {
      filteredRequests = filteredRequests.filter(
        (request) => request.urgency === filters.urgency
      );
    }

    if (filters.propertyType) {
      filteredRequests = filteredRequests.filter(
        (request) => request.propertyType.includes(filters.propertyType as PropertyType)
      );
    }

    if (filters.location) {
      filteredRequests = filteredRequests.filter(
        (request) => request.locations.some(loc => 
          loc.toLowerCase().includes(filters.location.toLowerCase())
        )
      );
    }

    setRequests(filteredRequests);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      urgency: '',
      propertyType: '',
      priceRange: '',
      location: '',
    });
    setSearchTerm('');
    setRequests(initialRequests);
  };

  const handleFormSubmit = (data: ClientNeeds) => {
    if (!selectedClientForForm) {
      alert('Please select a client first');
      return;
    }

    const newRequest: NeedsRequest = {
      ...data,
      clientId: selectedClientForForm.id,
      clientName: selectedClientForForm.name,
      clientEmail: selectedClientForForm.email,
      clientPhone: selectedClientForForm.phone,
      status: 'active',
      matchedProperties: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    setShowAddForm(false);
    setSelectedClientForForm(null);
  };

  const handleEditRequest = (data: ClientNeeds) => {
    if (!editingRequest) return;

    const updatedRequest: NeedsRequest = {
      ...editingRequest,
      ...data,
      updatedAt: new Date(),
    };

    const updatedRequests = requests.map(req => 
      req.id === editingRequest.id ? updatedRequest : req
    );
    setRequests(updatedRequests);
    setEditingRequest(null);
  };

  const handleDeleteRequest = (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
      setSelectedRequest(null);
    }
  };

  const handleValidateRequest = (requestId: string) => {
    if (window.confirm('Mark this request as completed and archive it?')) {
      const updatedRequests = requests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'archived' as const, updatedAt: new Date() }
          : req
      );
      setRequests(updatedRequests);
      setSelectedRequest(null);
    }
  };

  const findMatchingProperties = (request: NeedsRequest): Property[] => {
    return properties.filter(property => {
      // Check property type
      if (!request.propertyType.includes(property.type)) {
        return false;
      }

      // Check price range
      if (property.price < request.minPrice || property.price > request.maxPrice) {
        return false;
      }

      // Check surface range
      if (property.surface < request.minSurface || property.surface > request.maxSurface) {
        return false;
      }

      // Check location (partial match)
      const locationMatch = request.locations.some(reqLocation =>
        property.location.toLowerCase().includes(reqLocation.toLowerCase()) ||
        reqLocation.toLowerCase().includes(property.location.toLowerCase())
      );

      if (!locationMatch) {
        return false;
      }

      // Check features (at least some features should match)
      if (request.features.length > 0) {
        const featureMatch = request.features.some(reqFeature =>
          property.features.some(propFeature =>
            propFeature.toLowerCase().includes(reqFeature.toLowerCase())
          )
        );
        if (!featureMatch) {
          return false;
        }
      }

      return true;
    });
  };

  const getPropertyOwner = (ownerId?: string) => {
    if (!ownerId) return null;
    return clients.find(client => client.id === ownerId);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case UrgencyLevel.URGENT:
        return 'bg-red-100 text-red-800';
      case UrgencyLevel.HIGH:
        return 'bg-orange-100 text-orange-800';
      case UrgencyLevel.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case UrgencyLevel.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  const getRequestStats = () => {
    const total = requests.length;
    const active = requests.filter(r => r.status === 'active').length;
    const matched = requests.filter(r => r.status === 'matched').length;
    const archived = requests.filter(r => r.status === 'archived').length;
    const urgent = requests.filter(r => r.urgency === UrgencyLevel.URGENT).length;
    const high = requests.filter(r => r.urgency === UrgencyLevel.HIGH).length;

    return { total, active, matched, archived, urgent, high };
  };

  const stats = getRequestStats();

  const handleContactClient = (request: NeedsRequest, method: 'phone' | 'email' | 'whatsapp') => {
    switch (method) {
      case 'phone':
        window.location.href = `tel:${request.clientPhone}`;
        break;
      case 'email':
        const subject = encodeURIComponent(`Property Requirements - ${request.clientName}`);
        const body = encodeURIComponent(`Dear ${request.clientName},\n\nWe have found some properties that match your requirements:\n\nProperty Types: ${request.propertyType.join(', ')}\nPrice Range: ${formatPrice(request.minPrice)} - ${formatPrice(request.maxPrice)}\nSurface: ${request.minSurface} - ${request.maxSurface} m²\nLocations: ${request.locations.join(', ')}\n\nWould you like to schedule a viewing?\n\nBest regards,\n3Mconnect Team`);
        window.location.href = `mailto:${request.clientEmail}?subject=${subject}&body=${body}`;
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hi ${request.clientName}, we have found ${findMatchingProperties(request).length} properties that match your requirements. Would you like to see them?`);
        const phoneNumber = request.clientPhone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        break;
    }
  };

  // Get available clients for selection (buyers and tenants only)
  const availableClients = clients.filter(client => 
    client.role === 'buyer' || client.role === 'tenant'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Needs & Requests</h1>
          <p className="text-gray-600 mt-1">Track and manage customer property requirements</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Client Request</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.active}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Matched</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.matched}</p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Archive size={20} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Archived</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{stats.archived}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Urgent</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.urgent}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">High Priority</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.high}</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, email, phone, or requirements..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                showFilters || getActiveFiltersCount() > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filters</span>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="matched">Matched</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  name="urgency"
                  value={filters.urgency}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Urgency</option>
                  {Object.values(UrgencyLevel).map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  name="propertyType"
                  value={filters.propertyType}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {Object.values(PropertyType).map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Enter location"
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Target size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const matchingProperties = findMatchingProperties(request);
            
            return (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.clientName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{request.clientEmail}</span>
                      <span>{request.clientPhone}</span>
                      <span>Created: {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Communication Buttons */}
                    <button
                      onClick={() => handleContactClient(request, 'phone')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Call Client"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => handleContactClient(request, 'email')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      title="Email Client"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={() => handleContactClient(request, 'whatsapp')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      title="WhatsApp Client"
                    >
                      <MessageCircle size={16} />
                    </button>
                    
                    {/* Action Buttons */}
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingRequest(request)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Request"
                    >
                      <Edit size={16} />
                    </button>
                    
                    {/* Validate Button (Archive) */}
                    {request.status !== 'archived' && (
                      <button
                        onClick={() => handleValidateRequest(request.id)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors"
                        title="Mark as Completed & Archive"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Request"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Property Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.propertyType.slice(0, 2).map((type, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {type}
                        </span>
                      ))}
                      {request.propertyType.length > 2 && (
                        <span className="text-xs text-gray-500">+{request.propertyType.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Price Range</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(request.minPrice)} - {formatPrice(request.maxPrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Surface Range</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {request.minSurface} - {request.maxSurface} m²
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Locations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.locations.slice(0, 2).map((location, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                          {location}
                        </span>
                      ))}
                      {request.locations.length > 2 && (
                        <span className="text-xs text-gray-500">+{request.locations.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matching Properties */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Matching Properties ({matchingProperties.length})
                    </h4>
                    {matchingProperties.length > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        {matchingProperties.length} match{matchingProperties.length !== 1 ? 'es' : ''} found
                      </span>
                    )}
                  </div>
                  
                  {matchingProperties.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No matching properties found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {matchingProperties.slice(0, 3).map((property) => {
                        const owner = getPropertyOwner(property.ownerId);
                        return (
                          <div key={property.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm text-gray-900 truncate">{property.title}</h5>
                              <span className="text-xs text-blue-600 font-medium">
                                {formatPrice(property.price)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{property.location}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>{property.surface} m²</span>
                              <span className="capitalize">{property.type}</span>
                            </div>
                            {owner && (
                              <div className="text-xs text-gray-600 mb-2">
                                <span className="font-medium">Owner:</span> {owner.name}
                              </div>
                            )}
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleViewProperty(property)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                              >
                                View Property
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {matchingProperties.length > 3 && (
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-blue-700 font-medium">
                            +{matchingProperties.length - 3} more properties
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
                    <p className="text-sm text-gray-600">{request.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Request Form with Client Selection */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">New Client Request</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedClientForForm(null);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedClientForForm ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Client</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {availableClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClientForForm(client)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-semibold text-sm">
                              {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{client.name}</h4>
                            <p className="text-sm text-gray-600">{client.email}</p>
                            <p className="text-sm text-gray-600">{client.phone}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mt-1">
                              {client.role.charAt(0).toUpperCase() + client.role.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-semibold text-sm">
                            {selectedClientForForm.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Selected Client: {selectedClientForForm.name}</h4>
                          <p className="text-sm text-gray-600">{selectedClientForForm.email} • {selectedClientForForm.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClientForForm(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Client
                      </button>
                    </div>
                  </div>
                  <NeedsForm onSubmit={handleFormSubmit} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Form */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">Edit Request - {editingRequest.clientName}</h2>
              <button
                onClick={() => setEditingRequest(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-6">
              <NeedsForm 
                initialData={editingRequest} 
                onSubmit={handleEditRequest} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">Request Details - {selectedRequest.clientName}</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">Client Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedRequest.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedRequest.clientEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedRequest.clientPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Urgency:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                          {selectedRequest.urgency.charAt(0).toUpperCase() + selectedRequest.urgency.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Quick Contact Actions */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleContactClient(selectedRequest, 'phone')}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Phone size={16} />
                          Call
                        </button>
                        <button
                          onClick={() => handleContactClient(selectedRequest, 'email')}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Mail size={16} />
                          Email
                        </button>
                        <button
                          onClick={() => handleContactClient(selectedRequest, 'whatsapp')}
                          className="flex-1 bg-green-500 text-white py-2 px-3 rounded-md hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-amber-900 mb-3">Requirements</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Property Types:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRequest.propertyType.map((type, index) => (
                            <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Price Range:</span>
                        <p className="mt-1">{formatPrice(selectedRequest.minPrice)} - {formatPrice(selectedRequest.maxPrice)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Surface Range:</span>
                        <p className="mt-1">{selectedRequest.minSurface} - {selectedRequest.maxSurface} m²</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Preferred Locations:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRequest.locations.map((location, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {location}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedRequest.features.length > 0 && (
                        <div>
                          <span className="text-gray-600 font-medium">Required Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRequest.features.map((feature, index) => (
                              <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRequest.timeline && (
                        <div>
                          <span className="text-gray-600 font-medium">Timeline:</span>
                          <p className="mt-1">{selectedRequest.timeline}</p>
                        </div>
                      )}
                      {selectedRequest.notes && (
                        <div>
                          <span className="text-gray-600 font-medium">Additional Notes:</span>
                          <p className="mt-1">{selectedRequest.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">
                      Matching Properties ({findMatchingProperties(selectedRequest).length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {findMatchingProperties(selectedRequest).map((property) => {
                        const owner = getPropertyOwner(property.ownerId);
                        return (
                          <div key={property.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{property.title}</h4>
                              <span className="text-sm font-medium text-green-600">
                                {formatPrice(property.price)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{property.location}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>{property.surface} m²</span>
                              <span className="capitalize">{property.type}</span>
                              <span className="capitalize">{property.status}</span>
                            </div>
                            {owner && (
                              <div className="text-xs text-gray-600 mb-2">
                                <span className="font-medium">Owner:</span> {owner.name} • {owner.phone}
                              </div>
                            )}
                            <div className="flex justify-end">
                              <button 
                                onClick={() => handleViewProperty(property)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                              >
                                View Property
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {findMatchingProperties(selectedRequest).length === 0 && (
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          No matching properties found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
};

export default NeedsForms;