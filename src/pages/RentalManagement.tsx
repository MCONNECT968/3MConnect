import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowDownUp, 
  Home, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Send, 
  Phone, 
  Mail, 
  MessageCircle,
  Bell,
  BellOff
} from 'lucide-react';
import { 
  RentalContract, 
  RentalPayment, 
  RentalAlert, 
  RentalStatus, 
  PaymentStatus, 
  AlertPriority 
} from '../types';
import { rentalContracts, rentalPayments, rentalAlerts } from '../data/rentalData';
import { properties, clients } from '../data/mockData';
import RentalContractForm from '../components/rental/RentalContractForm';
import RentalContractDetails from '../components/rental/RentalContractDetails';
import PaymentForm from '../components/rental/PaymentForm';
import PaymentDetails from '../components/rental/PaymentDetails';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

const RentalManagement: React.FC = () => {
  const [contracts, setContracts] = useLocalStorage<RentalContract[]>(STORAGE_KEYS.RENTAL_CONTRACTS, rentalContracts);
  const [payments, setPayments] = useLocalStorage<RentalPayment[]>(STORAGE_KEYS.RENTAL_PAYMENTS, rentalPayments);
  const [alerts, setAlerts] = useLocalStorage<RentalAlert[]>(STORAGE_KEYS.RENTAL_ALERTS, rentalAlerts);
  const [activeTab, setActiveTab] = useState<'contracts' | 'payments' | 'alerts'>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<RentalPayment | null>(null);
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [filters, setFilters] = useState({
    status: '',
    property: '',
    tenant: '',
    owner: '',
    dateRange: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch contracts
        const contractsResponse = await api.get('/rental/contracts');
        if (contractsResponse.data) {
          // Convert dates to Date objects
          const formattedContracts = contractsResponse.data.map(contract => ({
            id: contract.id,
            propertyId: contract.property_id,
            tenantId: contract.tenant_id,
            ownerId: contract.owner_id,
            startDate: new Date(contract.start_date),
            endDate: new Date(contract.end_date),
            monthlyRent: contract.monthly_rent,
            deposit: contract.deposit,
            status: contract.status,
            paymentDay: contract.payment_day,
            contractTerms: contract.contract_terms,
            specialConditions: contract.special_conditions,
            documents: contract.documents || [],
            createdAt: new Date(contract.created_at),
            updatedAt: new Date(contract.updated_at),
            // Additional data from joins
            propertyTitle: contract.property_title,
            propertyLocation: contract.property_location,
            tenantName: contract.tenant_name,
            tenantPhone: contract.tenant_phone,
            ownerName: contract.owner_name,
            ownerPhone: contract.owner_phone
          }));
          setContracts(formattedContracts);
        }
        
        // Fetch payments
        const paymentsResponse = await api.get('/rental/payments');
        if (paymentsResponse.data) {
          // Convert dates to Date objects
          const formattedPayments = paymentsResponse.data.map(payment => ({
            id: payment.id,
            contractId: payment.contract_id,
            amount: payment.amount,
            dueDate: new Date(payment.due_date),
            paidDate: payment.paid_date ? new Date(payment.paid_date) : undefined,
            status: payment.status,
            paymentMethod: payment.payment_method,
            receiptNumber: payment.receipt_number,
            notes: payment.notes,
            lateFee: payment.late_fee,
            createdAt: new Date(payment.created_at),
            updatedAt: new Date(payment.updated_at),
            // Additional data from joins
            propertyId: payment.property_id,
            tenantId: payment.tenant_id,
            propertyTitle: payment.property_title,
            propertyLocation: payment.property_location,
            tenantName: payment.tenant_name,
            tenantPhone: payment.tenant_phone
          }));
          setPayments(formattedPayments);
        }
        
        // Fetch alerts
        const alertsResponse = await api.get('/rental/alerts');
        if (alertsResponse.data) {
          // Convert dates to Date objects
          const formattedAlerts = alertsResponse.data.map(alert => ({
            id: alert.id,
            type: alert.type,
            contractId: alert.contract_id,
            message: alert.message,
            priority: alert.priority,
            isRead: alert.is_read === 1,
            createdAt: new Date(alert.created_at),
            dueDate: alert.due_date ? new Date(alert.due_date) : undefined,
            // Additional data from joins
            propertyId: alert.property_id,
            tenantId: alert.tenant_id,
            propertyTitle: alert.property_title,
            tenantName: alert.tenant_name
          }));
          setAlerts(formattedAlerts);
        }
        
        // Fetch properties and clients for forms
        const propertiesResponse = await api.get('/properties');
        setAvailableProperties(propertiesResponse.data);
        
        const clientsResponse = await api.get('/clients');
        setAvailableClients(clientsResponse.data);
      } catch (err) {
        console.error('Error fetching rental data:', err);
        // Keep using local storage data
      } finally {
        setIsLoading(false);
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleAddContract = async (contractData: Partial<RentalContract>) => {
    try {
      // Prepare data for API
      const apiData = {
        propertyId: contractData.propertyId,
        tenantId: contractData.tenantId,
        ownerId: contractData.ownerId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        monthlyRent: contractData.monthlyRent,
        deposit: contractData.deposit,
        status: contractData.status,
        paymentDay: contractData.paymentDay,
        contractTerms: contractData.contractTerms,
        specialConditions: contractData.specialConditions
      };

      // Try to add contract via API
      let newContractId;
      try {
        const response = await api.post('/rental/contracts', apiData);
        newContractId = response.data.id;
      } catch (apiError) {
        console.warn('API contract creation failed, using local storage:', apiError);
        newContractId = Date.now().toString();
      }

      const newContract: RentalContract = {
        ...contractData,
        id: newContractId,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RentalContract;

      const updatedContracts = [newContract, ...contracts];
      setContracts(updatedContracts);
      setShowAddContract(false);
      success('Contract Added', 'The rental contract has been successfully created.');
    } catch (err) {
      console.error('Error adding contract:', err);
      error('Error', 'Failed to create rental contract. Please try again.');
    }
  };

  const handleAddPayment = async (paymentData: Partial<RentalPayment>) => {
    try {
      // Prepare data for API
      const apiData = {
        contractId: paymentData.contractId,
        amount: paymentData.amount,
        dueDate: paymentData.dueDate,
        paidDate: paymentData.paidDate,
        status: paymentData.status,
        paymentMethod: paymentData.paymentMethod,
        receiptNumber: paymentData.receiptNumber,
        notes: paymentData.notes,
        lateFee: paymentData.lateFee
      };

      // Try to add payment via API
      let newPaymentId;
      try {
        const response = await api.post('/rental/payments', apiData);
        newPaymentId = response.data.id;
      } catch (apiError) {
        console.warn('API payment creation failed, using local storage:', apiError);
        newPaymentId = Date.now().toString();
      }

      const newPayment: RentalPayment = {
        ...paymentData,
        id: newPaymentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RentalPayment;

      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      setShowAddPayment(false);
      success('Payment Added', 'The payment has been successfully recorded.');
    } catch (err) {
      console.error('Error adding payment:', err);
      error('Error', 'Failed to record payment. Please try again.');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      try {
        // Try to delete contract via API
        try {
          await api.delete(`/rental/contracts/${contractId}`);
        } catch (apiError) {
          console.warn('API contract deletion failed, using local storage:', apiError);
        }

        const updatedContracts = contracts.filter(c => c.id !== contractId);
        setContracts(updatedContracts);
        setSelectedContract(null);
        success('Contract Deleted', 'The rental contract has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting contract:', err);
        error('Error', 'Failed to delete rental contract. Please try again.');
      }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        // Try to delete payment via API
        try {
          await api.delete(`/rental/payments/${paymentId}`);
        } catch (apiError) {
          console.warn('API payment deletion failed, using local storage:', apiError);
        }

        const updatedPayments = payments.filter(p => p.id !== paymentId);
        setPayments(updatedPayments);
        setSelectedPayment(null);
        success('Payment Deleted', 'The payment record has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting payment:', err);
        error('Error', 'Failed to delete payment. Please try again.');
      }
    }
  };

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      // Try to update alert via API
      try {
        await api.put(`/rental/alerts/${alertId}/read`);
      } catch (apiError) {
        console.warn('API alert update failed, using local storage:', apiError);
      }

      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      );
      setAlerts(updatedAlerts);
      success('Alert Updated', 'The alert has been marked as read.');
    } catch (err) {
      console.error('Error updating alert:', err);
      error('Error', 'Failed to update alert. Please try again.');
    }
  };

  const handleDismissAllAlerts = async () => {
    if (window.confirm('Are you sure you want to mark all alerts as read?')) {
      try {
        // In a real app, we would have an API endpoint for this
        // For now, just update local state
        const updatedAlerts = alerts.map(alert => ({ ...alert, isRead: true }));
        setAlerts(updatedAlerts);
        success('Alerts Updated', 'All alerts have been marked as read.');
      } catch (err) {
        console.error('Error updating alerts:', err);
        error('Error', 'Failed to update alerts. Please try again.');
      }
    }
  };

  const getProperty = (propertyId: string) => {
    return availableProperties.find(property => property.id === propertyId) || 
           properties.find(property => property.id === propertyId);
  };

  const getClient = (clientId: string) => {
    return availableClients.find(client => client.id === clientId) || 
           clients.find(client => client.id === clientId);
  };

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case RentalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RentalStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case RentalStatus.TERMINATED:
        return 'bg-gray-100 text-gray-800';
      case RentalStatus.RENEWED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.LATE:
        return 'bg-orange-100 text-orange-800';
      case PaymentStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case PaymentStatus.PARTIAL:
        return 'bg-blue-100 text-blue-800';
      case PaymentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case AlertPriority.LOW:
        return 'bg-blue-100 text-blue-800';
      case AlertPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case AlertPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case AlertPriority.URGENT:
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

  const getContractDuration = (startDate: Date, endDate: Date) => {
    if (typeof startDate === 'string') startDate = new Date(startDate);
    if (typeof endDate === 'string') endDate = new Date(endDate);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return `${months} months`;
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  const getRentalStats = () => {
    const activeContracts = contracts.filter(c => c.status === RentalStatus.ACTIVE).length;
    const pendingContracts = contracts.filter(c => c.status === RentalStatus.PENDING).length;
    const totalRent = contracts
      .filter(c => c.status === RentalStatus.ACTIVE)
      .reduce((sum, c) => sum + c.monthlyRent, 0);
    const paidPayments = payments.filter(p => p.status === PaymentStatus.PAID).length;
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING).length;
    const overduePayments = payments.filter(p => 
      p.status === PaymentStatus.LATE || p.status === PaymentStatus.OVERDUE
    ).length;
    const unreadAlerts = alerts.filter(a => !a.isRead).length;

    return { 
      activeContracts, 
      pendingContracts, 
      totalRent, 
      paidPayments, 
      pendingPayments, 
      overduePayments,
      unreadAlerts
    };
  };

  const stats = getRentalStats();

  const handleContactClient = (clientId: string, method: 'phone' | 'email' | 'whatsapp') => {
    const client = getClient(clientId);
    if (!client) return;

    switch (method) {
      case 'phone':
        window.location.href = `tel:${client.phone}`;
        break;
      case 'email':
        const subject = encodeURIComponent('Regarding your rental contract');
        window.location.href = `mailto:${client.email}?subject=${subject}`;
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hello ${client.name}, this is regarding your rental contract.`);
        const phoneNumber = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Rental Management</h1>
          <p className="text-gray-600 mt-1">Manage rental contracts, payments, and alerts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddContract(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>New Contract</span>
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <DollarSign size={18} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Active Contracts</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.activeContracts}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendingContracts}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Monthly Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalRent)}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Paid</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.paidPayments}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.pendingPayments}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.overduePayments}</p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={20} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Alerts</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{stats.unreadAlerts}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'contracts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Contracts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                <span>Payments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} />
                <span>Alerts</span>
                {stats.unreadAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {stats.unreadAlerts}
                  </span>
                )}
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
                placeholder="Search by property, tenant, or owner..."
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
                  <option value="amount_desc">Amount (Highest)</option>
                  <option value="amount_asc">Amount (Lowest)</option>
                  <option value="status">Status</option>
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
                    {Object.values(RentalStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                    placeholder="Property name or location"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                  <input
                    type="text"
                    name="tenant"
                    value={filters.tenant}
                    onChange={handleFilterChange}
                    placeholder="Tenant name"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <input
                    type="text"
                    name="owner"
                    value={filters.owner}
                    onChange={handleFilterChange}
                    placeholder="Owner name"
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => {
                    setFilters({
                      status: '',
                      property: '',
                      tenant: '',
                      owner: '',
                      dateRange: '',
                    });
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first rental contract by clicking the "New Contract" button.
                  </p>
                  <button
                    onClick={() => setShowAddContract(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Create New Contract
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const property = getProperty(contract.propertyId);
                  const tenant = getClient(contract.tenantId);
                  const owner = getClient(contract.ownerId);
                  
                  // Use either the fetched data or the joined data from API
                  const propertyTitle = property?.title || contract.propertyTitle;
                  const propertyLocation = property?.location || contract.propertyLocation;
                  const tenantName = tenant?.name || contract.tenantName;
                  const tenantPhone = tenant?.phone || contract.tenantPhone;
                  
                  return (
                    <div key={contract.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Rental Contract #{contract.id}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({getContractDuration(contract.startDate, contract.endDate)})
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Home size={16} />
                              <div>
                                <p className="font-medium">{propertyTitle || 'Unknown Property'}</p>
                                <p className="text-xs">{propertyLocation}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} />
                              <div>
                                <p className="font-medium">{tenantName || 'Unknown Tenant'}</p>
                                <p className="text-xs">{tenantPhone}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign size={16} />
                              <div>
                                <p className="font-medium">{formatCurrency(contract.monthlyRent)}/month</p>
                                <p className="text-xs">Due on the {contract.paymentDay}{contract.paymentDay === 1 ? 'st' : contract.paymentDay === 2 ? 'nd' : contract.paymentDay === 3 ? 'rd' : 'th'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-blue-600">
                              <FileText size={14} />
                              <span>{contract.documents.length} document{contract.documents.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <DollarSign size={14} />
                              <span>Deposit: {formatCurrency(contract.deposit)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Contact Tenant Actions */}
                          {tenant && (
                            <>
                              <button
                                onClick={() => handleContactClient(tenant.id, 'phone')}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                title="Call Tenant"
                              >
                                <Phone size={16} />
                              </button>
                              <button
                                onClick={() => handleContactClient(tenant.id, 'email')}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                title="Email Tenant"
                              >
                                <Mail size={16} />
                              </button>
                              <button
                                onClick={() => handleContactClient(tenant.id, 'whatsapp')}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                title="WhatsApp Tenant"
                              >
                                <MessageCircle size={16} />
                              </button>
                            </>
                          )}

                          {/* View and Edit Actions */}
                          <button
                            onClick={() => setSelectedContract(contract)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setShowAddPayment(true)}
                            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                            title="Record Payment"
                          >
                            <DollarSign size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Contract"
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
          </>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <DollarSign size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-500 mb-4">
                    Record your first payment by clicking the "Record Payment" button.
                  </p>
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Record New Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const contract = contracts.find(c => c.id === payment.contractId);
                  const property = contract ? getProperty(contract.propertyId) : null;
                  const tenant = contract ? getClient(contract.tenantId) : null;
                  
                  // Use either the fetched data or the joined data from API
                  const propertyTitle = property?.title || payment.propertyTitle;
                  const propertyLocation = property?.location || payment.propertyLocation;
                  const tenantName = tenant?.name || payment.tenantName;
                  const tenantPhone = tenant?.phone || payment.tenantPhone;
                  
                  return (
                    <div key={payment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-full text-green-600">
                              <DollarSign size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                                {payment.lateFee && payment.lateFee > 0 && (
                                  <span className="text-sm text-red-600 ml-2">
                                    + {formatCurrency(payment.lateFee)} late fee
                                  </span>
                                )}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                                {payment.receiptNumber && (
                                  <span className="text-sm text-gray-600">
                                    Receipt: {payment.receiptNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={16} />
                              <div>
                                <p className="font-medium">Due: {formatDate(payment.dueDate)}</p>
                                {payment.paidDate && (
                                  <p className="text-xs">Paid: {formatDate(payment.paidDate)}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Home size={16} />
                              <div>
                                <p className="font-medium">{propertyTitle || 'Unknown Property'}</p>
                                <p className="text-xs">{propertyLocation}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} />
                              <div>
                                <p className="font-medium">{tenantName || 'Unknown Tenant'}</p>
                                <p className="text-xs">{tenantPhone}</p>
                              </div>
                            </div>
                          </div>

                          {payment.notes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                {payment.notes}
                              </p>
                            </div>
                          )}

                          {payment.paymentMethod && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Payment Method:</span> {payment.paymentMethod.replace('_', ' ').charAt(0).toUpperCase() + payment.paymentMethod.replace('_', ' ').slice(1)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {payment.status === PaymentStatus.PENDING && (
                            <button
                              onClick={() => window.alert('Mark as paid functionality would be implemented here')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {payment.receiptNumber && (
                            <button
                              onClick={() => window.alert('Download receipt functionality would be implemented here')}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                              title="Download Receipt"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          {payment.status === PaymentStatus.PENDING && (
                            <button
                              onClick={() => window.alert('Send payment reminder functionality would be implemented here')}
                              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                              title="Send Reminder"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Payment"
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
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Alerts & Notifications
                {alerts.filter(a => !a.isRead).length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {alerts.filter(a => !a.isRead).length} unread
                  </span>
                )}
              </h3>
              
              {alerts.filter(a => !a.isRead).length > 0 && (
                <button
                  onClick={handleDismissAllAlerts}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <BellOff size={16} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const contract = contracts.find(c => c.id === alert.contractId);
                  const property = contract ? getProperty(contract.propertyId) : null;
                  const tenant = contract ? getClient(contract.tenantId) : null;
                  
                  // Use either the fetched data or the joined data from API
                  const propertyTitle = property?.title || alert.propertyTitle;
                  const tenantName = tenant?.name || alert.tenantName;
                  
                  return (
                    <div 
                      key={alert.id} 
                      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                        alert.isRead ? 'border-gray-300' : 
                        alert.priority === AlertPriority.URGENT ? 'border-red-500' :
                        alert.priority === AlertPriority.HIGH ? 'border-orange-500' :
                        alert.priority === AlertPriority.MEDIUM ? 'border-yellow-500' :
                        'border-blue-500'
                      } ${!alert.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            alert.priority === AlertPriority.URGENT ? 'bg-red-100 text-red-600' :
                            alert.priority === AlertPriority.HIGH ? 'bg-orange-100 text-orange-600' :
                            alert.priority === AlertPriority.MEDIUM ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <AlertCircle size={20} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{alert.message}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAlertPriorityColor(alert.priority)}`}>
                                {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              {propertyTitle && (
                                <div className="flex items-center gap-1">
                                  <Home size={14} />
                                  <span>{propertyTitle}</span>
                                </div>
                              )}
                              
                              {tenantName && (
                                <div className="flex items-center gap-1">
                                  <User size={14} />
                                  <span>{tenantName}</span>
                                </div>
                              )}
                              
                              {alert.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{formatDate(alert.dueDate)}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{formatDate(alert.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!alert.isRead && (
                            <button
                              onClick={() => handleMarkAlertAsRead(alert.id)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                              title="Mark as Read"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          {alert.type === 'payment_overdue' && (
                            <button
                              onClick={() => window.alert('Send payment reminder functionality would be implemented here')}
                              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                              title="Send Reminder"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          
                          {tenant && (
                            <button
                              onClick={() => handleContactClient(tenant.id, 'phone')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                              title="Call Tenant"
                            >
                              <Phone size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contract Form */}
      {showAddContract && (
        <RentalContractForm
          onSubmit={handleAddContract}
          onClose={() => setShowAddContract(false)}
        />
      )}

      {/* Contract Details Modal */}
      {selectedContract && (
        <RentalContractDetails
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}

      {/* Add Payment Form */}
      {showAddPayment && (
        <PaymentForm
          onSubmit={handleAddPayment}
          onClose={() => setShowAddPayment(false)}
        />
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetails
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default RentalManagement;