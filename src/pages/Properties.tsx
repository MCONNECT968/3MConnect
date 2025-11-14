import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowDownUp, Building, Home, MapPin, DollarSign, Eye, Edit, Trash2, User, Calendar, Tag, ExternalLink, Phone, Mail, MessageCircle, Camera, Video } from 'lucide-react';
import PropertyCard from '../components/property/PropertyCard';
import PropertyForm from '../components/property/PropertyForm';
import PropertyDetails from '../components/property/PropertyDetails';
import { Property, PropertyStatus, PropertyType, PropertyCondition, TransactionType, SortOption } from '../types';
import { properties as mockProperties, clients } from '../data/mockData';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

const Properties: React.FC = () => {
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEYS.PROPERTIES, mockProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.DATE_CREATED_DESC);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    condition: '',
    transactionType: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    minSurface: '',
    maxSurface: '',
    minRooms: '',
    maxRooms: '',
    owner: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch properties from Firebase
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const propertiesData = await propertyService.getProperties();
        if (propertiesData && propertiesData.length > 0) {
          setProperties(propertiesData);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        // Keep using local storage data
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortOption = e.target.value as SortOption;
    setSortBy(sortOption);
    applySorting(sortOption, properties);
  };

  const applySorting = (sortOption: SortOption, propertiesToSort: Property[]) => {
    const sorted = [...propertiesToSort].sort((a, b) => {
      switch (sortOption) {
        case SortOption.DATE_CREATED_ASC:
          return a.createdAt.getTime() - b.createdAt.getTime();
        case SortOption.DATE_CREATED_DESC:
          return b.createdAt.getTime() - a.createdAt.getTime();
        case SortOption.TYPE:
          return a.type.localeCompare(b.type);
        case SortOption.PRICE_LOW_HIGH:
          return a.price - b.price;
        case SortOption.PRICE_HIGH_LOW:
          return b.price - a.price;
        case SortOption.SURFACE:
          return b.surface - a.surface;
        default:
          return 0;
      }
    });
    setProperties(sorted);
  };

  const handleAddProperty = async (propertyData: Partial<Property>) => {
    try {
      setIsLoading(true);
      
      // Add property to Firebase
      const newProperty = await propertyService.addProperty(propertyData);
      
      const updatedProperties = [newProperty, ...properties];
      setProperties(updatedProperties);
      applySorting(sortBy, updatedProperties);
      setShowAddForm(false);
      success('Property Added', 'The property has been successfully added.');
    } catch (err) {
      console.error('Error adding property:', err);
      error('Error', 'Failed to add property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProperty = async (propertyData: Partial<Property>) => {
    if (editingProperty) {
      try {
        setIsLoading(true);
        
        // Update property in Firebase
        await propertyService.updateProperty(editingProperty.id, propertyData);
        
        const updatedProperty: Property = {
          ...editingProperty,
          ...propertyData,
          updatedAt: new Date(),
        };

        const updatedProperties = properties.map(p => 
          p.id === editingProperty.id ? updatedProperty : p
        );
        setProperties(updatedProperties);
        applySorting(sortBy, updatedProperties);
        setEditingProperty(null);
        setSelectedProperty(updatedProperty);
        success('Property Updated', 'The property has been successfully updated.');
      } catch (err) {
        console.error('Error updating property:', err);
        error('Error', 'Failed to update property. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        
        // Delete property from Firebase
        await propertyService.deleteProperty(propertyId);
        
        const updatedProperties = properties.filter(p => p.id !== propertyId);
        setProperties(updatedProperties);
        setSelectedProperty(null);
        success('Property Deleted', 'The property has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting property:', err);
        error('Error', 'Failed to delete property. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applyFilters = () => {
    let filteredProperties = [...properties];

    if (searchTerm) {
      filteredProperties = filteredProperties.filter((property) =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.propertyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status) {
      filteredProperties = filteredProperties.filter(
        (property) => property.status === filters.status
      );
    }

    if (filters.type) {
      filteredProperties = filteredProperties.filter(
        (property) => property.type === filters.type
      );
    }

    if (filters.condition) {
      filteredProperties = filteredProperties.filter(
        (property) => property.condition === filters.condition
      );
    }

    if (filters.transactionType) {
      filteredProperties = filteredProperties.filter(
        (property) => property.transactionType === filters.transactionType
      );
    }

    if (filters.location) {
      filteredProperties = filteredProperties.filter(
        (property) => property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.owner) {
      filteredProperties = filteredProperties.filter((property) => {
        const owner = getPropertyOwner(property.ownerId);
        return owner?.name.toLowerCase().includes(filters.owner.toLowerCase());
      });
    }

    if (filters.minPrice) {
      filteredProperties = filteredProperties.filter(
        (property) => property.price >= Number(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filteredProperties = filteredProperties.filter(
        (property) => property.price <= Number(filters.maxPrice)
      );
    }

    if (filters.minSurface) {
      filteredProperties = filteredProperties.filter(
        (property) => property.surface >= Number(filters.minSurface)
      );
    }

    if (filters.maxSurface) {
      filteredProperties = filteredProperties.filter(
        (property) => property.surface <= Number(filters.maxSurface)
      );
    }

    if (filters.minRooms) {
      filteredProperties = filteredProperties.filter(
        (property) => (property.rooms || 0) >= Number(filters.minRooms)
      );
    }

    if (filters.maxRooms) {
      filteredProperties = filteredProperties.filter(
        (property) => (property.rooms || 0) <= Number(filters.maxRooms)
      );
    }

    applySorting(sortBy, filteredProperties);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      condition: '',
      transactionType: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      minSurface: '',
      maxSurface: '',
      minRooms: '',
      maxRooms: '',
      owner: '',
    });
    setSearchTerm('');
    applySorting(sortBy, properties);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case SortOption.DATE_CREATED_ASC:
        return 'Date Created (Oldest)';
      case SortOption.DATE_CREATED_DESC:
        return 'Date Created (Newest)';
      case SortOption.TYPE:
        return 'Property Type';
      case SortOption.PRICE_LOW_HIGH:
        return 'Price (Low to High)';
      case SortOption.PRICE_HIGH_LOW:
        return 'Price (High to Low)';
      case SortOption.SURFACE:
        return 'Surface Area';
      default:
        return option;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  const getPropertyOwner = (ownerId?: string) => {
    if (!ownerId) return null;
    return clients.find(client => client.id === ownerId);
  };

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case PropertyStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PropertyStatus.SOLD:
        return 'bg-blue-100 text-blue-800';
      case PropertyStatus.RENTED:
        return 'bg-purple-100 text-purple-800';
      case PropertyStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SALE:
        return 'bg-blue-100 text-blue-800';
      case TransactionType.RENTAL:
        return 'bg-purple-100 text-purple-800';
      case TransactionType.SEASONAL_RENTAL:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatCondition = (condition: PropertyCondition) => {
    switch (condition) {
      case PropertyCondition.NEW:
        return 'New';
      case PropertyCondition.RENOVATED:
        return 'Renovated';
      case PropertyCondition.GOOD_CONDITION:
        return 'Good Condition';
      case PropertyCondition.TO_RENOVATE:
        return 'To Renovate';
      default:
        return condition;
    }
  };

  const formatTransactionType = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SALE:
        return 'For Sale';
      case TransactionType.RENTAL:
        return 'For Rent';
      case TransactionType.SEASONAL_RENTAL:
        return 'Seasonal Rental';
      default:
        return type;
    }
  };

  const handleContactOwner = (property: Property, method: 'phone' | 'email' | 'whatsapp') => {
    const owner = getPropertyOwner(property.ownerId);
    if (!owner) {
      alert('Owner contact information not available');
      return;
    }

    switch (method) {
      case 'phone':
        window.location.href = `tel:${owner.phone}`;
        break;
      case 'email':
        const subject = encodeURIComponent(`Property Inquiry - ${property.title}`);
        const body = encodeURIComponent(`Hi ${owner.name},\n\nI'm interested in your property:\n\nProperty: ${property.title}\nID: ${property.propertyId}\nLocation: ${property.location}\nPrice: ${formatPrice(property.price)}\n\nPlease contact me for more information.\n\nBest regards`);
        window.location.href = `mailto:${owner.email}?subject=${subject}&body=${body}`;
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hi ${owner.name}, I'm interested in your property: ${property.title} (${property.propertyId})`);
        const phoneNumber = owner.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        break;
    }
  };

  // Get property statistics
  const getPropertyStats = () => {
    const total = properties.length;
    const available = properties.filter(p => p.status === PropertyStatus.AVAILABLE).length;
    const sold = properties.filter(p => p.status === PropertyStatus.SOLD).length;
    const rented = properties.filter(p => p.status === PropertyStatus.RENTED).length;
    const pending = properties.filter(p => p.status === PropertyStatus.PENDING).length;
    const forSale = properties.filter(p => p.transactionType === TransactionType.SALE).length;
    const forRent = properties.filter(p => p.transactionType === TransactionType.RENTAL).length;

    return { total, available, sold, rented, pending, forSale, forRent };
  };

  const stats = getPropertyStats();

  // Get all unique values for filter dropdowns
  const allLocations = Array.from(
    new Set(properties.map((property) => property.location))
  );
  const allOwners = Array.from(
    new Set(properties.map((property) => getPropertyOwner(property.ownerId)?.name).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Properties Portfolio</h1>
          <p className="text-gray-600 mt-1">Manage and track all property listings</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Property</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Home size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Available</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.available}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Rented</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.rented}</p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={20} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Sold</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{stats.sold}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
        </div>

        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-900">For Sale</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">{stats.forSale}</p>
        </div>

        <div className="bg-rose-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Home size={20} className="text-rose-600" />
            <span className="text-sm font-medium text-rose-900">For Rent</span>
          </div>
          <p className="text-2xl font-bold text-rose-900">{stats.forRent}</p>
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
              placeholder="Search by title, location, property ID, or description..."
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
            
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md">
              <ArrowDownUp size={18} />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border-none outline-none bg-transparent text-sm"
              >
                {Object.values(SortOption).map((option) => (
                  <option key={option} value={option}>
                    {getSortLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {Object.values(PropertyStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  name="type"
                  value={filters.type}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Conditions</option>
                  {Object.values(PropertyCondition).map((condition) => (
                    <option key={condition} value={condition}>
                      {formatCondition(condition)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  name="transactionType"
                  value={filters.transactionType}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {Object.values(TransactionType).map((type) => (
                    <option key={type} value={type}>
                      {formatTransactionType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  {allLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <select
                  name="owner"
                  value={filters.owner}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Owners</option>
                  {allOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (MAD)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Surface Area (m²)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minSurface"
                    value={filters.minSurface}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="maxSurface"
                    value={filters.maxSurface}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

      {/* Properties List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Building size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
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
          {/* Results Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building size={20} className="text-blue-600" />
                <span className="font-medium text-blue-900">
                  Showing {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all filters ({getActiveFiltersCount()})
                </button>
              )}
            </div>
          </div>

          {properties.map((property) => {
            const owner = getPropertyOwner(property.ownerId);
            const mainImage = property.photos[0] || 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
            
            return (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:flex-row">
                  {/* Property Image */}
                  <div className="lg:w-80 h-64 lg:h-auto relative flex-shrink-0">
                    <img
                      src={mainImage}
                      alt={property.title}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePropertyClick(property)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
                      }}
                    />
                    
                    {/* Image Overlay Info */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                        {property.propertyId}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTransactionTypeColor(property.transactionType)}`}>
                        {formatTransactionType(property.transactionType)}
                      </span>
                    </div>

                    {/* Media Count */}
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      {property.photos.length > 1 && (
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Camera size={12} />
                          <span>{property.photos.length}</span>
                        </div>
                      )}
                      {property.videos.length > 0 && (
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Video size={12} />
                          <span>{property.videos.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Overlay */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg">
                        <p className="text-lg font-bold">{formatPrice(property.price)}</p>
                        <p className="text-xs opacity-90">
                          {property.transactionType === TransactionType.RENTAL ? '/month' :
                           property.transactionType === TransactionType.SEASONAL_RENTAL ? '/season' : 'total'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Building size={20} />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handlePropertyClick(property)}>
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin size={14} />
                              <span>{property.location}</span>
                              <span>•</span>
                              <span className="capitalize">{property.type}</span>
                              <span>•</span>
                              <span>{formatCondition(property.condition)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Home size={16} />
                            <div>
                              <p className="font-medium">{property.surface} m²</p>
                              <p className="text-xs">Surface</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building size={16} />
                            <div>
                              <p className="font-medium">{property.rooms || 0} rooms</p>
                              <p className="text-xs">Rooms</p>
                            </div>
                          </div>
                          
                          {owner && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} />
                              <div>
                                <p className="font-medium truncate">{owner.name}</p>
                                <p className="text-xs">Owner</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} />
                            <div>
                              <p className="font-medium">{formatDate(property.createdAt)}</p>
                              <p className="text-xs">Listed</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {property.description}
                          </p>
                        </div>

                        {property.features.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {property.features.slice(0, 6).map((feature, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {feature}
                                </span>
                              ))}
                              {property.features.length > 6 && (
                                <span className="text-xs text-gray-500 px-2 py-1">+{property.features.length - 6} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {/* Contact Owner Actions */}
                        {owner && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleContactOwner(property, 'phone')}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                              title="Call Owner"
                            >
                              <Phone size={16} />
                            </button>
                            <button
                              onClick={() => handleContactOwner(property, 'email')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                              title="Email Owner"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => handleContactOwner(property, 'whatsapp')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                              title="WhatsApp Owner"
                            >
                              <MessageCircle size={16} />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-1">
                          {/* View Property */}
                          <button
                            onClick={() => handlePropertyClick(property)}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors"
                            title="View Property Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* External Link */}
                          <button
                            onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(property.location)}`, '_blank')}
                            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
                            title="View on Map"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>

                        <div className="flex gap-1">
                          {/* Edit and Delete */}
                          <button
                            onClick={() => setEditingProperty(property)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Property"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Property"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onEdit={(property) => {
            setEditingProperty(property);
            setSelectedProperty(null);
          }}
          onDelete={handleDeleteProperty}
        />
      )}

      {/* Add Property Form */}
      {showAddForm && (
        <PropertyForm
          onSubmit={handleAddProperty}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Property Form */}
      {editingProperty && (
        <PropertyForm
          initialData={editingProperty}
          onSubmit={handleEditProperty}
          onClose={() => setEditingProperty(null)}
        />
      )}
    </div>
  );
};

export default Properties;