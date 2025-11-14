import React, { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Building, 
  Image, 
  Video, 
  FileText, 
  Link, 
  Copy, 
  Share2, 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Target,
  TrendingUp,
  BarChart3,
  Globe,
  Smartphone,
  Zap,
  Heart,
  Bookmark
} from 'lucide-react';
import { properties, clients } from '../data/mockData';
import { Property, Client, PropertyType, TransactionType } from '../types';

// WhatsApp Campaign Interface
interface WhatsAppCampaign {
  id: string;
  name: string;
  type: 'property_listing' | 'newsletter' | 'promotion' | 'update';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  targetAudience: 'all' | 'buyers' | 'tenants' | 'owners' | 'custom';
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  responseCount: number;
  createdDate: Date;
  scheduledDate?: Date;
  sentDate?: Date;
  content: {
    message: string;
    propertyIds?: string[];
    mediaUrls?: string[];
    includeContact: boolean;
    includeWebsite: boolean;
  };
  analytics: {
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
  };
}

// WhatsApp Template Interface
interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'property_listing' | 'follow_up' | 'appointment' | 'newsletter' | 'promotion';
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdDate: Date;
}

// Contact List Interface
interface ContactList {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  criteria: {
    role?: string[];
    status?: string[];
    location?: string[];
    budget?: { min: number; max: number };
    tags?: string[];
  };
  createdDate: Date;
  lastUpdated: Date;
}

const WhatsAppSharing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'contacts' | 'analytics'>('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);

  // Mock Campaigns Data
  const [campaigns] = useState<WhatsAppCampaign[]>([
    {
      id: '1',
      name: 'New Luxury Villa Listing - Rabat',
      type: 'property_listing',
      status: 'sent',
      targetAudience: 'buyers',
      recipientCount: 156,
      sentCount: 156,
      deliveredCount: 152,
      readCount: 134,
      responseCount: 23,
      createdDate: new Date('2024-03-20'),
      sentDate: new Date('2024-03-20T10:00:00'),
      content: {
        message: '🏡 NEW LISTING: Luxury Villa in Rabat Souissi\n\n✨ 350m² of pure elegance\n💰 5,000,000 MAD\n📍 Prime location with garden\n\nInterested? Contact us now!',
        propertyIds: ['2'],
        mediaUrls: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'],
        includeContact: true,
        includeWebsite: true
      },
      analytics: {
        clickThroughRate: 18.5,
        responseRate: 14.7,
        conversionRate: 3.2
      }
    },
    {
      id: '2',
      name: 'Weekly Property Newsletter',
      type: 'newsletter',
      status: 'scheduled',
      targetAudience: 'all',
      recipientCount: 342,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      responseCount: 0,
      createdDate: new Date('2024-03-22'),
      scheduledDate: new Date('2024-03-25T09:00:00'),
      content: {
        message: '📰 Weekly Property Update\n\n🏠 5 New Listings This Week\n💼 Market Trends & Insights\n🎯 Special Offers for VIP Clients\n\nStay updated with the best deals!',
        includeContact: true,
        includeWebsite: true
      },
      analytics: {
        clickThroughRate: 0,
        responseRate: 0,
        conversionRate: 0
      }
    },
    {
      id: '3',
      name: 'Ramadan Special Offers',
      type: 'promotion',
      status: 'draft',
      targetAudience: 'custom',
      recipientCount: 89,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      responseCount: 0,
      createdDate: new Date('2024-03-23'),
      content: {
        message: '🌙 Ramadan Kareem! Special Property Offers\n\n🎁 0% Commission on Selected Properties\n💰 Flexible Payment Plans\n🏡 Premium Locations Available\n\nLimited Time Offer!',
        includeContact: true,
        includeWebsite: false
      },
      analytics: {
        clickThroughRate: 0,
        responseRate: 0,
        conversionRate: 0
      }
    }
  ]);

  // Mock Templates Data
  const [templates] = useState<WhatsAppTemplate[]>([
    {
      id: '1',
      name: 'Property Listing Announcement',
      category: 'property_listing',
      content: '🏡 NEW LISTING: {property_title}\n\n✨ {property_surface}m² of {property_condition}\n💰 {property_price} MAD\n📍 {property_location}\n\n{property_description}\n\nInterested? Contact us now!',
      variables: ['property_title', 'property_surface', 'property_condition', 'property_price', 'property_location', 'property_description'],
      isActive: true,
      usageCount: 45,
      createdDate: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Appointment Confirmation',
      category: 'appointment',
      content: '📅 Appointment Confirmed!\n\nHi {client_name},\n\nYour property viewing is confirmed for:\n🗓️ {appointment_date}\n🕐 {appointment_time}\n📍 {property_address}\n\nSee you there!',
      variables: ['client_name', 'appointment_date', 'appointment_time', 'property_address'],
      isActive: true,
      usageCount: 78,
      createdDate: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Follow-up Message',
      category: 'follow_up',
      content: 'Hi {client_name}! 👋\n\nJust following up on your interest in {property_title}.\n\nDo you have any questions? Would you like to schedule a viewing?\n\nI\'m here to help!',
      variables: ['client_name', 'property_title'],
      isActive: true,
      usageCount: 123,
      createdDate: new Date('2024-02-01')
    }
  ]);

  // Mock Contact Lists Data
  const [contactLists] = useState<ContactList[]>([
    {
      id: '1',
      name: 'VIP Buyers',
      description: 'High-budget buyers looking for luxury properties',
      contactCount: 45,
      criteria: {
        role: ['buyer'],
        status: ['active', 'prospect'],
        budget: { min: 2000000, max: 10000000 },
        tags: ['VIP', 'luxury']
      },
      createdDate: new Date('2024-01-10'),
      lastUpdated: new Date('2024-03-15')
    },
    {
      id: '2',
      name: 'Rental Prospects',
      description: 'Clients looking for rental properties',
      contactCount: 128,
      criteria: {
        role: ['tenant'],
        status: ['prospect', 'active'],
        budget: { min: 5000, max: 20000 }
      },
      createdDate: new Date('2024-01-15'),
      lastUpdated: new Date('2024-03-20')
    },
    {
      id: '3',
      name: 'Casablanca Investors',
      description: 'Property investors interested in Casablanca market',
      contactCount: 67,
      criteria: {
        role: ['buyer', 'owner'],
        location: ['Casablanca'],
        tags: ['investor', 'commercial']
      },
      createdDate: new Date('2024-02-01'),
      lastUpdated: new Date('2024-03-18')
    }
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'property_listing':
        return 'bg-blue-100 text-blue-800';
      case 'newsletter':
        return 'bg-purple-100 text-purple-800';
      case 'promotion':
        return 'bg-orange-100 text-orange-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendToWhatsApp = (property: Property, client?: Client) => {
    const message = encodeURIComponent(
      `🏡 ${property.title}\n\n` +
      `💰 ${formatCurrency(property.price)}\n` +
      `📍 ${property.location}\n` +
      `📐 ${property.surface} m²\n\n` +
      `${property.description}\n\n` +
      `Interested? Contact us for more details!`
    );
    
    if (client) {
      const phoneNumber = client.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const handleBulkShare = (propertyIds: string[], contactListId: string) => {
    alert(`Sharing ${propertyIds.length} properties to contact list. This would integrate with WhatsApp Business API.`);
  };

  const getCampaignStats = () => {
    const total = campaigns.length;
    const sent = campaigns.filter(c => c.status === 'sent').length;
    const scheduled = campaigns.filter(c => c.status === 'scheduled').length;
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipientCount, 0);
    const totalResponses = campaigns.reduce((sum, c) => sum + c.responseCount, 0);
    const avgResponseRate = totalRecipients > 0 ? (totalResponses / totalRecipients) * 100 : 0;

    return { total, sent, scheduled, totalRecipients, totalResponses, avgResponseRate };
  };

  const stats = getCampaignStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Marketing</h1>
          <p className="text-gray-600 mt-1">Share properties and manage WhatsApp campaigns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <MessageCircle size={18} />
            <span>New Campaign</span>
          </button>
          <button
            onClick={() => setShowNewTemplate(true)}
            className="flex items-center gap-2 border border-green-600 text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
          >
            <FileText size={18} />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Campaigns</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.total}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Send size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Sent</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.sent}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.scheduled}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Recipients</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.totalRecipients}</p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Responses</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{stats.totalResponses}</p>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-900">Response Rate</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">{stats.avgResponseRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Quick Property Sharing */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-green-600" />
          Quick Property Sharing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.slice(0, 6).map((property) => (
            <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={property.photos[0] || 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg'}
                  alt={property.title}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{property.title}</h3>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(property.price)}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendToWhatsApp(property)}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <MessageCircle size={14} />
                  Share
                </button>
                <button
                  onClick={() => setSelectedProperty(property)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'campaigns'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send size={16} />
                <span>Campaigns</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'templates'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Templates</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'contacts'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>Contact Lists</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={16} />
                <span>Analytics</span>
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
                placeholder="Search campaigns, templates, or contacts..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  showFilters
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                            {campaign.type.replace('_', ' ').charAt(0).toUpperCase() + campaign.type.replace('_', ' ').slice(1)}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                            {campaign.targetAudience}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{campaign.recipientCount}</p>
                        <p className="text-xs text-gray-600">Recipients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.deliveredCount}</p>
                        <p className="text-xs text-gray-600">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{campaign.readCount}</p>
                        <p className="text-xs text-gray-600">Read</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{campaign.responseCount}</p>
                        <p className="text-xs text-gray-600">Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">{campaign.analytics.responseRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Response Rate</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{campaign.content.message}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Created: {formatDate(campaign.createdDate)}</span>
                      {campaign.scheduledDate && (
                        <span>Scheduled: {formatDate(campaign.scheduledDate)}</span>
                      )}
                      {campaign.sentDate && (
                        <span>Sent: {formatDate(campaign.sentDate)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => alert('Edit campaign functionality would be implemented here')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => alert('Duplicate campaign functionality would be implemented here')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      title="Duplicate Campaign"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.category)}`}>
                          {template.category.replace('_', ' ').charAt(0).toUpperCase() + template.category.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <p className="text-sm text-gray-700 line-clamp-4">{template.content}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variables:</span>
                        <span className="font-medium">{template.variables.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usage:</span>
                        <span className="font-medium">{template.usageCount} times</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {template.variables.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {variable}
                            </span>
                          ))}
                          {template.variables.length > 3 && (
                            <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => alert('Use template functionality would be implemented here')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      title="Use Template"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => alert('Edit template functionality would be implemented here')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit Template"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => alert('Delete template functionality would be implemented here')}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Lists Tab */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactLists.map((list) => (
              <div key={list.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{list.name}</h3>
                        <p className="text-sm text-gray-600">{list.contactCount} contacts</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">{list.description}</p>

                    <div className="space-y-2 text-sm">
                      {list.criteria.role && (
                        <div>
                          <span className="text-gray-600">Roles:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {list.criteria.role.map((role, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs capitalize">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {list.criteria.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {formatCurrency(list.criteria.budget.min)} - {formatCurrency(list.criteria.budget.max)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(list.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => alert('Send campaign to list functionality would be implemented here')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      title="Send Campaign"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => alert('View contacts functionality would be implemented here')}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="View Contacts"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => alert('Edit list functionality would be implemented here')}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                      title="Edit List"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <MessageCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Messages</h3>
                    <p className="text-3xl font-bold text-green-600">1,247</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Eye size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Read Rate</h3>
                    <p className="text-3xl font-bold text-blue-600">87.3%</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+5.2% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <MessageCircle size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Response Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">23.8%</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-purple-600">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+8.1% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Target size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
                    <p className="text-3xl font-bold text-amber-600">4.7%</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-amber-600">
                  <TrendingUp size={16} className="mr-1" />
                  <span>+2.3% from last month</span>
                </div>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
              <div className="space-y-4">
                {campaigns.filter(c => c.status === 'sent').map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <span className="text-sm text-gray-600">{formatDate(campaign.sentDate!)}</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-blue-600">{campaign.deliveredCount}</p>
                        <p className="text-gray-600">Delivered</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(campaign.deliveredCount / campaign.recipientCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="font-bold text-green-600">{campaign.readCount}</p>
                        <p className="text-gray-600">Read</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(campaign.readCount / campaign.deliveredCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="font-bold text-purple-600">{campaign.responseCount}</p>
                        <p className="text-gray-600">Responses</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(campaign.responseCount / campaign.readCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="font-bold text-amber-600">{campaign.analytics.responseRate.toFixed(1)}%</p>
                        <p className="text-gray-600">Rate</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-amber-600 h-2 rounded-full" 
                            style={{ width: `${campaign.analytics.responseRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">Create New Campaign</h2>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                <select className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="property_listing">Property Listing</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotion">Promotion</option>
                  <option value="update">Update</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="all">All Contacts</option>
                  <option value="buyers">Buyers Only</option>
                  <option value="tenants">Tenants Only</option>
                  <option value="owners">Owners Only</option>
                  <option value="custom">Custom List</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your WhatsApp message..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input type="checkbox" id="includeContact" className="h-4 w-4 text-green-600 rounded" />
                  <label htmlFor="includeContact" className="ml-2 text-sm text-gray-700">
                    Include contact information
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="includeWebsite" className="h-4 w-4 text-green-600 rounded" />
                  <label htmlFor="includeWebsite" className="ml-2 text-sm text-gray-700">
                    Include website link
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Campaign creation functionality would be implemented here');
                    setShowNewCampaign(false);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSharing;