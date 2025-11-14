import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowDownUp, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Building, 
  User, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MessageCircle,
  FileText,
  Camera,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Activity,
  Archive,
  Download,
  Upload
} from 'lucide-react';
import { 
  MaintenanceRequest, 
  MaintenanceCategory, 
  MaintenancePriority, 
  MaintenanceStatus,
  Property,
  Client
} from '../types';
import { maintenanceRequests as mockRequests } from '../data/rentalData';
import { properties, clients } from '../data/mockData';
import MaintenanceForm from '../components/rental/MaintenanceForm';
import MaintenanceDetails from '../components/rental/MaintenanceDetails';
import PropertyDetails from '../components/property/PropertyDetails';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

// Service Provider Interface
interface ServiceProvider {
  id: string;
  name: string;
  category: MaintenanceCategory[];
  phone: string;
  email: string;
  address?: string;
  rating: number;
  completedJobs: number;
  averageCost: number;
  responseTime: string; // e.g., "2-4 hours"
  availability: 'available' | 'busy' | 'unavailable';
  specialties: string[];
  notes?: string;
  createdAt: Date;
}

const Maintenance: React.FC = () => {
  const [requests, setRequests] = useLocalStorage<MaintenanceRequest[]>(STORAGE_KEYS.MAINTENANCE_REQUESTS, mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'providers' | 'quotes' | 'history'>('requests');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    property: '',
    provider: '',
    dateRange: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);

  // Fetch maintenance requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const requestsData = await maintenanceService.getMaintenanceRequests();
        if (requestsData && requestsData.length > 0) {
          setRequests(requestsData);
        }
      } catch (err) {
        console.error('Error fetching maintenance requests:', err);
        // Keep using local storage data
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Fetch properties and clients for forms
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the property and client services from firebaseService
        setAvailableProperties(properties);
        setAvailableClients(clients);
      } catch (err) {
        console.error('Error fetching data:', err);
        setAvailableProperties(properties);
        setAvailableClients(clients);
      }
    };

    fetchData();
  }, []);

  // Mock Service Providers
  const [serviceProviders] = useState<ServiceProvider[]>([
    {
      id: '1',
      name: 'Ahmed Plumbing Services',
      category: [MaintenanceCategory.PLUMBING],
      phone: '+212 661 123456',
      email: 'ahmed.plumbing@example.com',
      address: 'Casablanca, Morocco',
      rating: 4.8,
      completedJobs: 156,
      averageCost: 450,
      responseTime: '2-4 hours',
      availability: 'available',
      specialties: ['Pipe Repair', 'Leak Detection', 'Bathroom Installation'],
      notes: 'Reliable and fast service. Available 24/7 for emergencies.',
      createdAt: new Date('2023-01-15')
    },
    {
      id: '2',
      name: 'Hassan Electrical Works',
      category: [MaintenanceCategory.ELECTRICAL],
      phone: '+212 662 234567',
      email: 'hassan.electric@example.com',
      address: 'Rabat, Morocco',
      rating: 4.6,
      completedJobs: 89,
      averageCost: 320,
      responseTime: '4-6 hours',
      availability: 'available',
      specialties: ['Wiring', 'Light Installation', 'Electrical Panels'],
      notes: 'Certified electrician with 10+ years experience.',
      createdAt: new Date('2023-02-20')
    },
    {
      id: '3',
      name: 'Marrakech Heating Solutions',
      category: [MaintenanceCategory.HEATING],
      phone: '+212 663 345678',
      email: 'heating@marrakech.com',
      address: 'Marrakech, Morocco',
      rating: 4.9,
      completedJobs: 203,
      averageCost: 680,
      responseTime: '1-2 hours',
      availability: 'busy',
      specialties: ['HVAC Systems', 'Boiler Repair', 'Air Conditioning'],
      notes: 'Premium service provider. Slightly higher rates but excellent quality.',
      createdAt: new Date('2022-11-10')
    }
  ]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleAddRequest = async (requestData: Partial<MaintenanceRequest>) => {
    try {
      setIsLoading(true);
      
      // Add maintenance request to Firebase
      const newRequest = await maintenanceService.addMaintenanceRequest(requestData);

      const updatedRequests = [newRequest, ...requests];
      setRequests(updatedRequests);
      setShowAddForm(false);
      success('Request Added', 'The maintenance request has been successfully added.');
    } catch (err) {
      console.error('Error adding maintenance request:', err);
      error('Error', 'Failed to add maintenance request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRequest = async (requestData: Partial<MaintenanceRequest>) => {
    if (editingRequest) {
      try {
        // Prepare data for API
        const formData = new FormData();
        
        // Add all maintenance request data
        Object.entries(requestData).forEach(([key, value]) => {
          if (key !== 'photos') {
            if (typeof value === 'object' && value instanceof Date) {
              formData.append(key, value.toISOString());
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
              formData.append(key, String(value));
            }
          }
        });
        
        // Convert camelCase to snake_case for API
        if (requestData.propertyId) formData.set('property_id', requestData.propertyId);
        if (requestData.contractId) formData.set('contract_id', requestData.contractId);
        if (requestData.tenantId) formData.set('tenant_id', requestData.tenantId);
        if (requestData.reportedDate) formData.set('reported_date', requestData.reportedDate.toISOString());
        if (requestData.scheduledDate) formData.set('scheduled_date', requestData.scheduledDate.toISOString());
        if (requestData.completedDate) formData.set('completed_date', requestData.completedDate.toISOString());
        if (requestData.assignedTo) formData.set('assigned_to', requestData.assignedTo);

        // Try to update request via API
        try {
          await api.put(`/maintenance/${editingRequest.id}`, formData);
        } catch (apiError) {
          console.warn('API request update failed, using local storage:', apiError);
        }

        const updatedRequest: MaintenanceRequest = {
          ...editingRequest,
          ...requestData,
        };

        const updatedRequests = requests.map(r => 
          r.id === editingRequest.id ? updatedRequest : r
        );
        setRequests(updatedRequests);
        setEditingRequest(null);
        success('Request Updated', 'The maintenance request has been successfully updated.');
      } catch (err) {
        console.error('Error updating maintenance request:', err);
        error('Error', 'Failed to update maintenance request. Please try again.');
      }
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      try {
        // Try to delete request via API
        try {
          await api.delete(`/maintenance/${requestId}`);
        } catch (apiError) {
          console.warn('API request deletion failed, using local storage:', apiError);
        }

        const updatedRequests = requests.filter(r => r.id !== requestId);
        setRequests(updatedRequests);
        setSelectedRequest(null);
        success('Request Deleted', 'The maintenance request has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting maintenance request:', err);
        error('Error', 'Failed to delete maintenance request. Please try again.');
      }
    }
  };

  const getProperty = (propertyId: string): Property | undefined => {
    return availableProperties.find(property => property.id === propertyId) || 
           properties.find(property => property.id === propertyId);
  };

  const getTenant = (tenantId?: string): Client | undefined => {
    if (!tenantId) return undefined;
    return availableClients.find(client => client.id === tenantId) || 
           clients.find(client => client.id === tenantId);
  };

  const getServiceProvider = (providerId: string): ServiceProvider | undefined => {
    return serviceProviders.find(provider => provider.id === providerId);
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.REPORTED:
        return 'bg-yellow-100 text-yellow-800';
      case MaintenanceStatus.ASSIGNED:
        return 'bg-blue-100 text-blue-800';
      case MaintenanceStatus.IN_PROGRESS:
        return 'bg-orange-100 text-orange-800';
      case MaintenanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MaintenanceStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: MaintenancePriority) => {
    switch (priority) {
      case MaintenancePriority.EMERGENCY:
        return 'bg-red-100 text-red-800';
      case MaintenancePriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case MaintenancePriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case MaintenancePriority.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRequestStats = () => {
    const total = requests.length;
    const reported = requests.filter(r => r.status === MaintenanceStatus.REPORTED).length;
    const inProgress = requests.filter(r => r.status === MaintenanceStatus.IN_PROGRESS).length;
    const completed = requests.filter(r => r.status === MaintenanceStatus.COMPLETED).length;
    const emergency = requests.filter(r => r.priority === MaintenancePriority.EMERGENCY).length;
    const totalCost = requests.filter(r => r.cost).reduce((sum, r) => sum + (r.cost || 0), 0);

    return { total, reported, inProgress, completed, emergency, totalCost };
  };

  const stats = getRequestStats();

  const applyFilters = () => {
    let filteredRequests = [...requests];

    if (searchTerm) {
      filteredRequests = filteredRequests.filter(
        (request) =>
          request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.assignedTo && request.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (request.propertyTitle && request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (request.propertyLocation && request.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (request.tenantName && request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }

    if (filters.priority) {
      filteredRequests = filteredRequests.filter(r => r.priority === filters.priority);
    }

    if (filters.category) {
      filteredRequests = filteredRequests.filter(r => r.category === filters.category);
    }

    if (filters.property) {
      filteredRequests = filteredRequests.filter(r => {
        const property = getProperty(r.propertyId);
        return property?.title.toLowerCase().includes(filters.property.toLowerCase()) ||
               property?.location.toLowerCase().includes(filters.property.toLowerCase()) ||
               (r.propertyTitle && r.propertyTitle.toLowerCase().includes(filters.property.toLowerCase())) ||
               (r.propertyLocation && r.propertyLocation.toLowerCase().includes(filters.property.toLowerCase()));
      });
    }

    setRequests(filteredRequests);
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      property: '',
      provider: '',
      dateRange: '',
    });
    setSearchTerm('');
    // Reload requests from API or local storage
    const fetchRequests = async () => {
      try {
        const response = await api.get('/maintenance');
        if (response.data) {
          const formattedRequests = response.data.map(request => ({
            id: request.id,
            propertyId: request.property_id,
            contractId: request.contract_id,
            tenantId: request.tenant_id,
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            status: request.status,
            reportedDate: new Date(request.reported_date),
            scheduledDate: request.scheduled_date ? new Date(request.scheduled_date) : undefined,
            completedDate: request.completed_date ? new Date(request.completed_date) : undefined,
            cost: request.cost,
            assignedTo: request.assigned_to,
            photos: request.photos || [],
            notes: request.notes,
            propertyTitle: request.property_title,
            propertyLocation: request.property_location,
            tenantName: request.tenant_name,
            tenantPhone: request.tenant_phone
          }));
          setRequests(formattedRequests);
        }
      } catch (err) {
        console.error('Error fetching maintenance requests:', err);
        setRequests(mockRequests);
      }
    };
    fetchRequests();
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance Management</h1>
          <p className="text-gray-600 mt-1">Monitor maintenance work, manage providers, and track history</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Report Maintenance</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Reported</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.reported}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.inProgress}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Emergency</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.emergency}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Cost</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalCost)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench size={16} />
                <span>Maintenance Requests</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'providers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>Service Providers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'quotes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Quotes</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span>Work History</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search and Controls */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search maintenance requests, providers, or descriptions..."
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
                  <option value="date_desc">Date (Newest)</option>
                  <option value="date_asc">Date (Oldest)</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="cost">Cost</option>
                </select>
              </div>
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
                    {Object.values(MaintenanceStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={filters.priority}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priorities</option>
                    {Object.values(MaintenancePriority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {Object.values(MaintenanceCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <input
                    type="text"
                    name="property"
                    value={filters.property}
                    onChange={handleFilterChange}
                    placeholder="Property name"
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
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Maintenance Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading maintenance requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Wrench size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
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
              requests.map((request) => {
                const property = getProperty(request.propertyId);
                const tenant = getTenant(request.tenantId);
                
                // Use either the fetched data or the joined data from API
                const propertyTitle = property?.title || request.propertyTitle;
                const propertyLocation = property?.location || request.propertyLocation;
                const tenantName = tenant?.name || request.tenantName;
                const tenantPhone = tenant?.phone || request.tenantPhone;
                
                return (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <Wrench size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                                {request.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building size={16} />
                            <div>
                              <p className="font-medium">{propertyTitle || 'Unknown Property'}</p>
                              <p className="text-xs">{propertyLocation}</p>
                            </div>
                          </div>
                          
                          {(tenant || tenantName) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} />
                              <div>
                                <p className="font-medium">{tenantName}</p>
                                <p className="text-xs">{tenantPhone}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} />
                            <div>
                              <p className="font-medium">{formatDate(request.reportedDate)}</p>
                              <p className="text-xs">Reported</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            {request.description}
                          </p>
                        </div>

                        {request.photos.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Camera size={16} className="text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Photos ({request.photos.length})</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto">
                              {request.photos.slice(0, 4).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Maintenance issue ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(photo, '_blank')}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg';
                                  }}
                                />
                              ))}
                              {request.photos.length > 4 && (
                                <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{request.photos.length - 4}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {request.cost && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign size={16} className="text-green-600" />
                            <span className="font-medium text-green-600">{formatCurrency(request.cost)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Service Providers Tab */}
        {activeTab === 'providers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-sm">
                          {provider.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(provider.availability)}`}>
                          {provider.availability.charAt(0).toUpperCase() + provider.availability.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <span>{provider.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        <span>{provider.email}</span>
                      </div>
                      {provider.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} />
                          <span>{provider.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rating:</span>
                        {renderStarRating(provider.rating)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completed Jobs:</span>
                        <span className="font-medium">{provider.completedJobs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg. Cost:</span>
                        <span className="font-medium">{formatCurrency(provider.averageCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium">{provider.responseTime}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.specialties.slice(0, 3).map((specialty, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {specialty}
                          </span>
                        ))}
                        {provider.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{provider.specialties.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `tel:${provider.phone}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Phone size={14} />
                        Call
                      </button>
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent('Maintenance Service Inquiry');
                          window.location.href = `mailto:${provider.email}?subject=${subject}`;
                        }}
                        className="flex-1 border border-blue-600 text-blue-600 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Mail size={14} />
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes available</h3>
              <p className="text-gray-500 mb-4">
                Quotes will be available when you connect to the maintenance service providers API.
              </p>
            </div>
          </div>
        )}

        {/* Work History Tab */}
        {activeTab === 'history' && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No work history available</h3>
              <p className="text-gray-500 mb-4">
                Work history will be available when maintenance requests are completed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Maintenance Form */}
      {showAddForm && (
        <MaintenanceForm
          onSubmit={handleAddRequest}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Maintenance Form */}
      {editingRequest && (
        <MaintenanceForm
          initialData={editingRequest}
          onSubmit={handleEditRequest}
          onClose={() => setEditingRequest(null)}
        />
      )}

      {/* Maintenance Details Modal */}
      {selectedRequest && (
        <MaintenanceDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
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

export default Maintenance;