import React, { useState, useEffect } from 'react';
import { Building, Users, ClipboardList, Calendar as CalendarIcon, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Eye, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/dashboard/MetricCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import Calendar from '../components/dashboard/Calendar';
import { dashboardMetrics, calendarEvents, properties, clients } from '../data/mockData';
import { rentalContracts, rentalPayments, maintenanceRequests } from '../data/rentalData';
import { PropertyStatus, ClientStatus, PaymentStatus, MaintenanceStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { darkMode } = useTheme();
  const { t } = useTranslation();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate real-time metrics
  const getRealTimeMetrics = () => {
    const activeListings = properties.filter(p => p.status === PropertyStatus.AVAILABLE).length;
    const activeRentals = rentalContracts.filter(c => c.status === 'active').length;
    const newClients = clients.filter(c => {
      const daysSinceCreated = Math.floor((new Date().getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated <= 30; // New clients in last 30 days
    }).length;
    
    const pendingTasks = [
      ...rentalPayments.filter(p => p.status === PaymentStatus.OVERDUE || p.status === PaymentStatus.LATE),
      ...maintenanceRequests.filter(m => m.status === MaintenanceStatus.REPORTED),
      ...clients.filter(c => c.status === ClientStatus.PROSPECT)
    ].length;

    return { activeListings, activeRentals, newClients, pendingTasks };
  };

  const metrics = getRealTimeMetrics();

  // Calculate trends (mock data for demonstration)
  const getTrends = () => {
    return {
      activeListings: { value: 8, isPositive: true },
      activeRentals: { value: 12, isPositive: true },
      newClients: { value: 15, isPositive: true },
      pendingTasks: { value: 25, isPositive: false }
    };
  };

  const trends = getTrends();

  // Get recent activities with real data
  const getRecentActivities = () => {
    const activities = [];

    // Recent properties
    const recentProperties = properties
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 2);
    
    recentProperties.forEach(property => {
      activities.push({
        id: `property-${property.id}`,
        type: 'property' as const,
        title: 'New Property Added',
        description: `${property.title} was added to the listings in ${property.location}.`,
        timestamp: property.createdAt
      });
    });

    // Recent clients
    const recentClients = clients
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 2);
    
    recentClients.forEach(client => {
      activities.push({
        id: `client-${client.id}`,
        type: 'client' as const,
        title: 'New Client Registered',
        description: `${client.name} registered as a new ${client.role}.`,
        timestamp: client.createdAt
      });
    });

    // Recent maintenance
    const recentMaintenance = maintenanceRequests
      .sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime())
      .slice(0, 1);
    
    recentMaintenance.forEach(request => {
      const property = properties.find(p => p.id === request.propertyId);
      activities.push({
        id: `maintenance-${request.id}`,
        type: 'other' as const,
        title: 'Maintenance Request',
        description: `${request.title} reported for ${property?.title || 'property'}.`,
        timestamp: request.reportedDate
      });
    });

    // Recent payments
    const recentPayments = rentalPayments
      .filter(p => p.status === PaymentStatus.PAID)
      .sort((a, b) => (b.paidDate?.getTime() || 0) - (a.paidDate?.getTime() || 0))
      .slice(0, 1);
    
    recentPayments.forEach(payment => {
      const contract = rentalContracts.find(c => c.id === payment.contractId);
      const tenant = clients.find(c => c.id === contract?.tenantId);
      activities.push({
        id: `payment-${payment.id}`,
        type: 'document' as const,
        title: 'Payment Received',
        description: `Monthly rent payment of ${payment.amount.toLocaleString()} MAD received from ${tenant?.name || 'tenant'}.`,
        timestamp: payment.paidDate || payment.createdAt
      });
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);
  };

  const recentActivities = getRecentActivities();

  // Get upcoming events with real data
  const getUpcomingEvents = () => {
    const events = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Upcoming payments
    const upcomingPayments = rentalPayments.filter(p => 
      p.status === PaymentStatus.PENDING && 
      p.dueDate >= today && 
      p.dueDate <= nextWeek
    );

    upcomingPayments.forEach(payment => {
      const contract = rentalContracts.find(c => c.id === payment.contractId);
      const tenant = clients.find(c => c.id === contract?.tenantId);
      const property = properties.find(p => p.id === contract?.propertyId);
      
      events.push({
        id: `payment-${payment.id}`,
        title: `Rent Due - ${tenant?.name || 'Tenant'}`,
        date: payment.dueDate,
        location: property?.location || 'Property'
      });
    });

    // Overdue maintenance
    const urgentMaintenance = maintenanceRequests.filter(m => 
      m.status === MaintenanceStatus.REPORTED && 
      m.priority === 'emergency'
    );

    urgentMaintenance.forEach(request => {
      const property = properties.find(p => p.id === request.propertyId);
      events.push({
        id: `maintenance-${request.id}`,
        title: `Urgent: ${request.title}`,
        date: request.reportedDate,
        location: property?.location || 'Property'
      });
    });

    return events.slice(0, 5);
  };

  const upcomingEvents = getUpcomingEvents();

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-property':
        navigate('/properties');
        break;
      case 'add-client':
        navigate('/clients');
        break;
      case 'create-form':
        navigate('/needs-forms');
        break;
      case 'schedule':
        navigate('/calendar');
        break;
      default:
        break;
    }
  };

  // Get alerts and notifications
  const getAlerts = () => {
    const alerts = [];

    // Overdue payments
    const overduePayments = rentalPayments.filter(p => 
      p.status === PaymentStatus.OVERDUE || p.status === PaymentStatus.LATE
    );
    
    if (overduePayments.length > 0) {
      alerts.push({
        id: 'overdue-payments',
        type: 'warning',
        title: 'Overdue Payments',
        message: `${overduePayments.length} payment${overduePayments.length > 1 ? 's' : ''} overdue`,
        action: () => navigate('/rental-management')
      });
    }

    // Urgent maintenance
    const urgentMaintenance = maintenanceRequests.filter(m => 
      m.status === MaintenanceStatus.REPORTED && 
      (m.priority === 'emergency' || m.priority === 'high')
    );
    
    if (urgentMaintenance.length > 0) {
      alerts.push({
        id: 'urgent-maintenance',
        type: 'error',
        title: 'Urgent Maintenance',
        message: `${urgentMaintenance.length} urgent maintenance request${urgentMaintenance.length > 1 ? 's' : ''}`,
        action: () => navigate('/maintenance')
      });
    }

    // Expiring contracts
    const expiringContracts = rentalContracts.filter(c => {
      const daysUntilExpiry = Math.floor((c.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });
    
    if (expiringContracts.length > 0) {
      alerts.push({
        id: 'expiring-contracts',
        type: 'info',
        title: 'Contracts Expiring Soon',
        message: `${expiringContracts.length} contract${expiringContracts.length > 1 ? 's' : ''} expiring within 30 days`,
        action: () => navigate('/rental-management')
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  // Financial overview
  const getFinancialOverview = () => {
    const totalRentCollected = rentalPayments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingRent = rentalPayments
      .filter(p => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const maintenanceCosts = maintenanceRequests
      .filter(m => m.cost)
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      totalRentCollected,
      pendingRent,
      maintenanceCosts,
      netIncome: totalRentCollected - maintenanceCosts
    };
  };

  const financialData = getFinancialOverview();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900 to-blue-700' : 'bg-gradient-to-r from-blue-600 to-blue-800'} rounded-lg p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('dashboard.welcome')}</h1>
            <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>{t('dashboard.portfolioValue')}</p>
            <p className="text-3xl font-bold text-white">
              {properties.reduce((sum, p) => sum + p.price, 0).toLocaleString()} MAD
            </p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${darkMode ? 
                alert.type === 'error' ? 'bg-red-900 bg-opacity-20 border-red-700' :
                alert.type === 'warning' ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' :
                'bg-blue-900 bg-opacity-20 border-blue-700'
                :
                alert.type === 'error' ? 'bg-red-50 border-red-400' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
              onClick={alert.action}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle 
                    size={20} 
                    className={darkMode ?
                      alert.type === 'error' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                      :
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    } 
                  />
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{alert.message}</p>
                  </div>
                </div>
                <ArrowRight size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Listings"
          value={metrics.activeListings}
          icon={Building}
          trend={trends.activeListings}
          bgColor="bg-blue-900"
          textColor="text-white"
        />
        <MetricCard
          title="Active Rentals"
          value={metrics.activeRentals}
          icon={Building}
          trend={trends.activeRentals}
          bgColor="bg-teal-700"
          textColor="text-white"
        />
        <MetricCard
          title="New Clients"
          value={metrics.newClients}
          icon={Users}
          trend={trends.newClients}
          bgColor="bg-amber-700"
          textColor="text-white"
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          icon={ClipboardList}
          trend={trends.pendingTasks}
          bgColor="bg-red-700"
          textColor="text-white"
        />
      </div>

      {/* Financial Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className={darkMode ? 'text-green-400' : 'text-green-600'} />
          <span className="dark:text-white">{t('dashboard.financialOverview')}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`text-center p-4 ${darkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-50'} rounded-lg`}>
            <DollarSign className={`h-8 w-8 ${darkMode ? 'text-green-400' : 'text-green-600'} mx-auto mb-2`} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('dashboard.rentCollected')}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {financialData.totalRentCollected.toLocaleString()} MAD
            </p>
          </div>
          <div className={`text-center p-4 ${darkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'} rounded-lg`}>
            <Clock className={`h-8 w-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mx-auto mb-2`} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('dashboard.pendingRent')}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {financialData.pendingRent.toLocaleString()} MAD
            </p>
          </div>
          <div className={`text-center p-4 ${darkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'} rounded-lg`}>
            <AlertCircle className={`h-8 w-8 ${darkMode ? 'text-red-400' : 'text-red-600'} mx-auto mb-2`} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('dashboard.maintenanceCosts')}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              {financialData.maintenanceCosts.toLocaleString()} MAD
            </p>
          </div>
          <div className={`text-center p-4 ${darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'} rounded-lg`}>
            <TrendingUp className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mx-auto mb-2`} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('dashboard.netIncome')}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {financialData.netIncome.toLocaleString()} MAD
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>
        <div>
          <Calendar events={upcomingEvents} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('add-property')}
            className={`flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-blue-900 bg-opacity-20 hover:bg-blue-900 hover:bg-opacity-30' : 'bg-blue-50 hover:bg-blue-100'} rounded-lg transition-colors group`}
          >
            <Building className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-700'} mb-2 group-hover:scale-110 transition-transform`} />
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.addProperty')}</span>
          </button>
          <button 
            onClick={() => handleQuickAction('add-client')}
            className={`flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-green-900 bg-opacity-20 hover:bg-green-900 hover:bg-opacity-30' : 'bg-green-50 hover:bg-green-100'} rounded-lg transition-colors group`}
          >
            <Users className={`h-8 w-8 ${darkMode ? 'text-green-400' : 'text-green-700'} mb-2 group-hover:scale-110 transition-transform`} />
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.addClient')}</span>
          </button>
          <button 
            onClick={() => handleQuickAction('create-form')}
            className={`flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-amber-900 bg-opacity-20 hover:bg-amber-900 hover:bg-opacity-30' : 'bg-amber-50 hover:bg-amber-100'} rounded-lg transition-colors group`}
          >
            <ClipboardList className={`h-8 w-8 ${darkMode ? 'text-amber-400' : 'text-amber-700'} mb-2 group-hover:scale-110 transition-transform`} />
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.createForm')}</span>
          </button>
          <button 
            onClick={() => handleQuickAction('schedule')}
            className={`flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-purple-900 bg-opacity-20 hover:bg-purple-900 hover:bg-opacity-30' : 'bg-purple-50 hover:bg-purple-100'} rounded-lg transition-colors group`}
          >
            <CalendarIcon className={`h-8 w-8 ${darkMode ? 'text-purple-400' : 'text-purple-700'} mb-2 group-hover:scale-110 transition-transform`} />
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.scheduleVisit')}</span>
          </button>
        </div>
      </div>

      {/* Property Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('dashboard.portfolioStatus')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.values(PropertyStatus).map((status) => {
            const count = properties.filter(p => p.status === status).length;
            const percentage = properties.length > 0 ? (count / properties.length) * 100 : 0;
            
            return (
              <div key={status} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path 
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        status === PropertyStatus.AVAILABLE ? 'text-green-500' :
                        status === PropertyStatus.RENTED ? 'text-blue-500' :
                        status === PropertyStatus.SOLD ? 'text-purple-500' :
                        status === PropertyStatus.PENDING ? 'text-yellow-500' :
                        'text-gray-500'
                      }
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={`${percentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold dark:text-white">{count}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;