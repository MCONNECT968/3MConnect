import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Building, 
  Phone, 
  Mail, 
  MessageCircle, 
  Plus, 
  Filter, 
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Calendar as CalendarFilterIcon
} from 'lucide-react';
import { PropertyVisit, VisitStatus, VisitType, VisitOutcome, Client, Property } from '../types';
import { propertyVisits as mockVisits, clients, properties } from '../data/mockData';
import PropertyDetails from '../components/property/PropertyDetails';
import ClientDetails from '../components/client/ClientDetails';
import VisitForm from '../components/calendar/VisitForm';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

const Calendar: React.FC = () => {
  const [visits, setVisits] = useLocalStorage<PropertyVisit[]>(STORAGE_KEYS.PROPERTY_VISITS, mockVisits);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<PropertyVisit | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PropertyVisit | null>(null);
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    isActive: false
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    agent: '',
    property: '',
    client: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);

  // Fetch visits from API
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setIsLoading(true);
        const visitsData = await visitService.getVisits();
        if (visitsData && visitsData.length > 0) {
          setVisits(visitsData);
        }
      } catch (err) {
        console.error('Error fetching visits:', err);
        // Keep using local storage data
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const applyDateRangeFilter = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      alert('Start date must be before end date');
      return;
    }

    setDateRange({
      ...dateRange,
      isActive: true
    });
    setShowDateRangeFilter(false);
  };

  const clearDateRangeFilter = () => {
    setDateRange({
      startDate: '',
      endDate: '',
      isActive: false
    });
  };

  const getClient = (clientId: string): Client | undefined => {
    return availableClients.find(client => client.id === clientId) || 
           clients.find(client => client.id === clientId);
  };

  const getProperty = (propertyId: string): Property | undefined => {
    return availableProperties.find(property => property.id === propertyId) || 
           properties.find(property => property.id === propertyId);
  };

  const handleAddVisit = async (visitData: Partial<PropertyVisit>) => {
    try {
      setIsLoading(true);
      
      // Add visit to Firebase
      const newVisit = await visitService.addVisit(visitData);

      const updatedVisits = [newVisit, ...visits];
      setVisits(updatedVisits);
      setShowVisitForm(false);
      success('Visit Scheduled', 'The property visit has been successfully scheduled.');
    } catch (err) {
      console.error('Error adding visit:', err);
      error('Error', 'Failed to schedule visit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVisit = async (visitData: Partial<PropertyVisit>) => {
    if (editingVisit) {
      try {
        setIsLoading(true);
        
        // Update visit in Firebase
        await visitService.updateVisit(editingVisit.id, visitData);

        const updatedVisit: PropertyVisit = {
          ...editingVisit,
          ...visitData,
          updatedAt: new Date(),
        };

        const updatedVisits = visits.map(v => 
          v.id === editingVisit.id ? updatedVisit : v
        );
        setVisits(updatedVisits);
        setEditingVisit(null);
        success('Visit Updated', 'The property visit has been successfully updated.');
      } catch (err) {
        console.error('Error updating visit:', err);
        error('Error', 'Failed to update visit. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (window.confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        
        // Delete visit from Firebase
        await visitService.deleteVisit(visitId);

        const updatedVisits = visits.filter(v => v.id !== visitId);
        setVisits(updatedVisits);
        success('Visit Deleted', 'The property visit has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting visit:', err);
        error('Error', 'Failed to delete visit. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getVisitStatusColor = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case VisitStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case VisitStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case VisitStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      case VisitStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case VisitStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-800';
      case VisitStatus.RESCHEDULED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisitTypeIcon = (type: VisitType) => {
    switch (type) {
      case VisitType.FIRST_VIEWING:
        return <Eye size={16} />;
      case VisitType.SECOND_VIEWING:
        return <Eye size={16} />;
      case VisitType.FINAL_INSPECTION:
        return <CheckCircle size={16} />;
      case VisitType.PROPERTY_EVALUATION:
        return <Building size={16} />;
      case VisitType.MAINTENANCE_CHECK:
        return <AlertCircle size={16} />;
      case VisitType.HANDOVER:
        return <Home size={16} />;
      default:
        return <CalendarIcon size={16} />;
    }
  };

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateForInput = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  };

  const isUpcoming = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date > new Date();
  };

  const isPast = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date < new Date();
  };

  const isToday = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isInDateRange = (date: Date) => {
    if (!dateRange.isActive || !dateRange.startDate || !dateRange.endDate) {
      return true;
    }

    const visitDate = new Date(date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Set time to start/end of day for proper comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    visitDate.setHours(visitDate.getHours(), visitDate.getMinutes(), 0, 0);

    return visitDate >= startDate && visitDate <= endDate;
  };

  const getFilteredVisits = () => {
    let filteredVisits = [...visits];

    // Filter by view mode
    if (viewMode === 'upcoming') {
      filteredVisits = filteredVisits.filter(visit => isUpcoming(visit.scheduledDate));
    } else if (viewMode === 'past') {
      filteredVisits = filteredVisits.filter(visit => isPast(visit.scheduledDate));
    }

    // Apply date range filter
    if (dateRange.isActive) {
      filteredVisits = filteredVisits.filter(visit => isInDateRange(visit.scheduledDate));
    }

    // Apply search
    if (searchTerm) {
      filteredVisits = filteredVisits.filter(visit => {
        const client = getClient(visit.clientId);
        const property = getProperty(visit.propertyId);
        return (
          client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Additional fields from joined data
          visit.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.propertyLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply filters
    if (filters.status) {
      filteredVisits = filteredVisits.filter(visit => visit.status === filters.status);
    }

    if (filters.type) {
      filteredVisits = filteredVisits.filter(visit => visit.type === filters.type);
    }

    if (filters.client) {
      filteredVisits = filteredVisits.filter(visit => {
        const client = getClient(visit.clientId);
        return client?.name.toLowerCase().includes(filters.client.toLowerCase()) ||
               visit.clientName?.toLowerCase().includes(filters.client.toLowerCase());
      });
    }

    if (filters.property) {
      filteredVisits = filteredVisits.filter(visit => {
        const property = getProperty(visit.propertyId);
        return property?.title.toLowerCase().includes(filters.property.toLowerCase()) ||
               property?.location.toLowerCase().includes(filters.property.toLowerCase()) ||
               visit.propertyTitle?.toLowerCase().includes(filters.property.toLowerCase()) ||
               visit.propertyLocation?.toLowerCase().includes(filters.property.toLowerCase());
      });
    }

    // Sort by date
    return filteredVisits.sort((a, b) => {
      if (viewMode === 'upcoming') {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      } else {
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      }
    });
  };

  const handleContactClient = (client: Client, method: 'phone' | 'email' | 'whatsapp') => {
    switch (method) {
      case 'phone':
        window.location.href = `tel:${client.phone}`;
        break;
      case 'email':
        const subject = encodeURIComponent(`Property Visit Follow-up - ${client.name}`);
        window.location.href = `mailto:${client.email}?subject=${subject}`;
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hi ${client.name}, this is regarding your upcoming property visit.`);
        const phoneNumber = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        break;
    }
  };

  const handleSendReminder = async (visitId: string) => {
    try {
      setIsLoading(true);
      
      // Update visit in Firebase
      await visitService.updateVisit(visitId, { reminderSent: true });

      const updatedVisits = visits.map(visit => 
        visit.id === visitId 
          ? { ...visit, reminderSent: true, updatedAt: new Date() }
          : visit
      );
      setVisits(updatedVisits);
      success('Reminder Sent', 'The reminder has been sent successfully.');
    } catch (err) {
      console.error('Error sending reminder:', err);
      error('Error', 'Failed to send reminder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, newStatus: VisitStatus) => {
    try {
      setIsLoading(true);
      
      // Update visit in Firebase
      await visitService.updateVisit(visitId, { status: newStatus });

      const updatedVisits = visits.map(visit => 
        visit.id === visitId 
          ? { ...visit, status: newStatus, updatedAt: new Date() }
          : visit
      );
      setVisits(updatedVisits);
      success('Status Updated', `Visit status has been updated to ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      console.error('Error updating visit status:', err);
      error('Error', 'Failed to update visit status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getVisitStats = () => {
    const today = new Date();
    const upcoming = visits.filter(visit => isUpcoming(visit.scheduledDate)).length;
    const todayVisits = visits.filter(visit => isToday(visit.scheduledDate)).length;
    const thisWeek = visits.filter(visit => {
      const visitDate = new Date(visit.scheduledDate);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return visitDate >= weekStart && visitDate <= weekEnd && isUpcoming(visitDate);
    }).length;
    const completed = visits.filter(visit => visit.status === VisitStatus.COMPLETED).length;
    const pending = visits.filter(visit => 
      visit.status === VisitStatus.SCHEDULED || visit.status === VisitStatus.CONFIRMED
    ).length;

    return { upcoming, todayVisits, thisWeek, completed, pending };
  };

  const stats = getVisitStats();
  const filteredVisits = getFilteredVisits();

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      agent: '',
      property: '',
      client: '',
    });
    setSearchTerm('');
    clearDateRangeFilter();
  };

  const getActiveFiltersCount = () => {
    const regularFilters = Object.values(filters).filter(value => value !== '').length;
    const searchFilter = searchTerm ? 1 : 0;
    const dateRangeFilter = dateRange.isActive ? 1 : 0;
    return regularFilters + searchFilter + dateRangeFilter;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Property Visits Calendar</h1>
          <p className="text-gray-600 mt-1">Manage and track all property viewings and appointments</p>
        </div>
        <button
          onClick={() => setShowVisitForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.upcoming}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Today</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.todayVisits}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">This Week</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.thisWeek}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Completed</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Pending</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
        </div>
      </div>

      {/* View Mode Tabs and Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'upcoming'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upcoming Visits
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'past'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Past Visits
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Visits
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client, property, or location..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Date Range Filter Button */}
          <button
            onClick={() => setShowDateRangeFilter(!showDateRangeFilter)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
              dateRange.isActive
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CalendarFilterIcon size={18} />
            <span>Date Range</span>
            {dateRange.isActive && (
              <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                ✓
              </span>
            )}
          </button>

          {/* Filters */}
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

        {/* Date Range Filter Panel */}
        {showDateRangeFilter && (
          <div className="mt-4 p-4 border-t bg-blue-50 rounded-b-lg">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <CalendarFilterIcon size={20} />
              Filter by Date Range
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => {
                  const today = new Date();
                  setDateRange({
                    startDate: formatDateForInput(today),
                    endDate: formatDateForInput(today),
                    isActive: false
                  });
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  setDateRange({
                    startDate: formatDateForInput(tomorrow),
                    endDate: formatDateForInput(tomorrow),
                    isActive: false
                  });
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Tomorrow
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  setDateRange({
                    startDate: formatDateForInput(today),
                    endDate: formatDateForInput(nextWeek),
                    isActive: false
                  });
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Next 7 Days
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextMonth = new Date(today);
                  nextMonth.setMonth(today.getMonth() + 1);
                  setDateRange({
                    startDate: formatDateForInput(today),
                    endDate: formatDateForInput(nextMonth),
                    isActive: false
                  });
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Next 30 Days
              </button>
            </div>

            {/* Current Active Filter Display */}
            {dateRange.isActive && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Active Filter: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={clearDateRangeFilter}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDateRangeFilter(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyDateRangeFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        )}

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
                  {Object.values(VisitStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {Object.values(VisitType).map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  name="client"
                  value={filters.client}
                  onChange={handleFilterChange}
                  placeholder="Client name"
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <input
                  type="text"
                  name="property"
                  value={filters.property}
                  onChange={handleFilterChange}
                  placeholder="Property or location"
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
            </div>
          </div>
        )}
      </div>

      {/* Visits List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visits...</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
            <p className="text-gray-500 mb-4">
              {dateRange.isActive 
                ? `No visits found in the selected date range (${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}).`
                : viewMode === 'upcoming' 
                ? 'No upcoming visits scheduled.' 
                : viewMode === 'past' 
                ? 'No past visits found.' 
                : 'No visits match your search criteria.'
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-600" />
                <span className="font-medium text-blue-900">
                  Showing {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''}
                  {dateRange.isActive && (
                    <span className="text-blue-700">
                      {' '}from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
                    </span>
                  )}
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

          {filteredVisits.map((visit) => {
            const client = getClient(visit.clientId);
            const property = getProperty(visit.propertyId);
            
            // Use either the fetched data or the joined data from API
            const clientName = client?.name || visit.clientName;
            const clientPhone = client?.phone || visit.clientPhone;
            const propertyTitle = property?.title || visit.propertyTitle;
            const propertyLocation = property?.location || visit.propertyLocation;
            
            if (!clientName || !propertyTitle) return null;

            return (
              <div key={visit.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        {getVisitTypeIcon(visit.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {visit.type.replace('_', ' ').charAt(0).toUpperCase() + visit.type.replace('_', ' ').slice(1)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                            {visit.status.charAt(0).toUpperCase() + visit.status.slice(1).replace('_', ' ')}
                          </span>
                          {isToday(visit.scheduledDate) && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                              Today
                            </span>
                          )}
                          {!visit.reminderSent && isUpcoming(visit.scheduledDate) && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              No Reminder
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <div>
                          <p className="font-medium">{formatDateTime(visit.scheduledDate)}</p>
                          <p className="text-xs">{visit.duration} minutes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={16} />
                        <div>
                          <p className="font-medium">{clientName}</p>
                          <p className="text-xs">{clientPhone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building size={16} />
                        <div>
                          <p className="font-medium">{propertyTitle}</p>
                          <p className="text-xs">{propertyLocation}</p>
                        </div>
                      </div>
                    </div>

                    {visit.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          <span className="font-medium">Notes:</span> {visit.notes}
                        </p>
                      </div>
                    )}

                    {visit.outcome && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700">Outcome: </span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          visit.outcome === VisitOutcome.VERY_INTERESTED || visit.outcome === VisitOutcome.READY_TO_PROCEED
                            ? 'bg-green-100 text-green-800'
                            : visit.outcome === VisitOutcome.INTERESTED || visit.outcome === VisitOutcome.WANTS_SECOND_VIEWING
                            ? 'bg-blue-100 text-blue-800'
                            : visit.outcome === VisitOutcome.NOT_INTERESTED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {visit.outcome.replace('_', ' ').charAt(0).toUpperCase() + visit.outcome.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Contact Client Actions */}
                    {client && (
                      <>
                        <button
                          onClick={() => handleContactClient(client, 'phone')}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                          title="Call Client"
                        >
                          <Phone size={16} />
                        </button>
                        <button
                          onClick={() => handleContactClient(client, 'email')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                          title="Email Client"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => handleContactClient(client, 'whatsapp')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                          title="WhatsApp Client"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </>
                    )}

                    {/* Reminder Action */}
                    {!visit.reminderSent && isUpcoming(visit.scheduledDate) && (
                      <button
                        onClick={() => handleSendReminder(visit.id)}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                        title="Send Reminder"
                      >
                        <Bell size={16} />
                      </button>
                    )}

                    {/* View Actions */}
                    {client && (
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors"
                        title="View Client Details"
                      >
                        <Users size={16} />
                      </button>
                    )}
                    {property && (
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
                        title="View Property Details"
                      >
                        <Home size={16} />
                      </button>
                    )}

                    {/* Status Update Actions */}
                    {visit.status === VisitStatus.SCHEDULED && (
                      <button
                        onClick={() => handleUpdateVisitStatus(visit.id, VisitStatus.CONFIRMED)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                        title="Confirm Visit"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}

                    {(visit.status === VisitStatus.SCHEDULED || visit.status === VisitStatus.CONFIRMED) && (
                      <button
                        onClick={() => handleUpdateVisitStatus(visit.id, VisitStatus.CANCELLED)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                        title="Cancel Visit"
                      >
                        <XCircle size={16} />
                      </button>
                    )}

                    {/* Edit and Delete */}
                    <button
                      onClick={() => setEditingVisit(visit)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Visit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Visit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Visit Form */}
      {showVisitForm && (
        <VisitForm
          onSubmit={handleAddVisit}
          onClose={() => setShowVisitForm(false)}
        />
      )}

      {/* Edit Visit Form */}
      {editingVisit && (
        <VisitForm
          initialData={editingVisit}
          onSubmit={handleEditVisit}
          onClose={() => setEditingVisit(null)}
        />
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};

export default Calendar;