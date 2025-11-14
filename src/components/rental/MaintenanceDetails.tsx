import React from 'react';
import { X, Wrench, AlertTriangle, Calendar, DollarSign, User, Home, Camera, FileText } from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { rentalContracts } from '../../data/rentalData';
import { clients, properties } from '../../data/mockData';

interface MaintenanceDetailsProps {
  request: MaintenanceRequest;
  onClose: () => void;
}

const MaintenanceDetails: React.FC<MaintenanceDetailsProps> = ({ request, onClose }) => {
  const property = properties.find(p => p.id === request.propertyId);
  const contract = rentalContracts.find(c => c.id === request.contractId);
  const tenant = request.tenantId ? clients.find(c => c.id === request.tenantId) : null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">Maintenance Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Overview */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
              <Wrench size={20} />
              Request Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Request ID</p>
                <p className="text-lg font-semibold text-red-900">{request.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {request.status.replace('_', ' ').charAt(0).toUpperCase() + request.status.replace('_', ' ').slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Priority</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Category</p>
                <p className="text-lg font-semibold text-red-900 capitalize">{request.category}</p>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Issue Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Title</p>
                <p className="text-lg font-semibold text-gray-900">{request.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-gray-700 bg-white p-4 rounded border">{request.description}</p>
              </div>
            </div>
          </div>

          {/* Property & Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Info */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Home size={20} />
                Property Information
              </h3>
              {property && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Property</p>
                    <p className="text-lg font-semibold text-gray-900">{property.title}</p>
                    <p className="text-gray-600">{property.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Details</p>
                    <p className="text-gray-600">{property.surface} m² • {property.type}</p>
                    <p className="text-gray-600">{property.rooms} rooms</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tenant Info */}
            {tenant && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <User size={20} />
                  Reported By
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tenant</p>
                    <p className="text-lg font-semibold text-gray-900">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-gray-600">{tenant.email}</p>
                    <p className="text-gray-600">{tenant.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Management */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Timeline & Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Reported Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(request.reportedDate)}</p>
              </div>
              {request.scheduledDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Scheduled Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(request.scheduledDate)}</p>
                </div>
              )}
              {request.completedDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Completed Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(request.completedDate)}</p>
                </div>
              )}
              {request.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Assigned To</p>
                  <p className="text-lg font-semibold text-gray-900">{request.assignedTo}</p>
                </div>
              )}
              {request.cost && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Cost</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(request.cost)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {request.photos.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera size={20} />
                Photos ({request.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {request.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Maintenance issue photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(photo, '_blank')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Click to view
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Additional Notes
              </h3>
              <p className="text-gray-700 bg-white p-4 rounded border">{request.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetails;