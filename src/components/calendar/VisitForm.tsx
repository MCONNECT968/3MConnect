import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Building, FileText, MapPin } from 'lucide-react';
import { PropertyVisit, VisitStatus, VisitType, Client, Property } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';

interface VisitFormProps {
  onSubmit: (data: Partial<PropertyVisit>) => void;
  onClose: () => void;
  initialData?: Partial<PropertyVisit>;
}

const VisitForm: React.FC<VisitFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []);
  const [users, setUsers] = useLocalStorage<any[]>(STORAGE_KEYS.USERS, []);
  
  const [formData, setFormData] = useState<Partial<PropertyVisit>>(
    initialData || {
      propertyId: '',
      clientId: '',
      agentId: '',
      scheduledDate: new Date(),
      duration: 60,
      status: VisitStatus.SCHEDULED,
      type: VisitType.FIRST_VIEWING,
      notes: '',
    }
  );

  // Get available clients (buyers and tenants)
  const availableClients = clients.filter(client => 
    client.role === 'buyer' || client.role === 'tenant'
  );

  // Get available properties
  const availableProperties = properties.filter(property => 
    property.status === 'available' || property.status === 'pending'
  );

  // Get available agents
  const availableAgents = users.filter(user => 
    user.role === 'agent' || user.role === 'admin'
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'scheduledDate') {
      setFormData({
        ...formData,
        [name]: new Date(value),
      });
    } else if (name === 'duration') {
      setFormData({
        ...formData,
        [name]: Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.propertyId || !formData.clientId || !formData.scheduledDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if the scheduled date is in the future (for new visits)
    if (!initialData && formData.scheduledDate && formData.scheduledDate <= new Date()) {
      alert('Please select a future date and time for the visit');
      return;
    }

    onSubmit(formData);
  };

  const getSelectedClient = () => {
    return availableClients.find(client => client.id === formData.clientId);
  };

  const getSelectedProperty = () => {
    return availableProperties.find(property => property.id === formData.propertyId);
  };

  const formatDateTimeForInput = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatVisitType = (type: VisitType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatVisitStatus = (status: VisitStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Visit' : 'Schedule New Visit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Client Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client *
              </label>
              {availableClients.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">No clients available</option>
                  </select>
                  <a 
                    href="/clients" 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add a client first
                  </a>
                </div>
              ) : (
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a client...</option>
                  {availableClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.phone} ({client.role})
                    </option>
                  ))}
                </select>
              )}
              
              {getSelectedClient() && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-semibold text-sm">
                        {getSelectedClient()!.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getSelectedClient()!.name}</p>
                      <p className="text-sm text-gray-600">{getSelectedClient()!.email}</p>
                      <p className="text-sm text-gray-600">{getSelectedClient()!.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Selection */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Building size={20} />
              Property Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property *
              </label>
              {availableProperties.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <select
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">No properties available</option>
                  </select>
                  <a 
                    href="/properties" 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add a property first
                  </a>
                </div>
              ) : (
                <select
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a property...</option>
                  {availableProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.location} ({property.price.toLocaleString()} MAD)
                    </option>
                  ))}
                </select>
              )}
              
              {getSelectedProperty() && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Building size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{getSelectedProperty()!.title}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin size={14} />
                        <span>{getSelectedProperty()!.location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{getSelectedProperty()!.surface} m²</span>
                        <span className="capitalize">{getSelectedProperty()!.type}</span>
                        <span className="font-medium text-blue-600">
                          {getSelectedProperty()!.price.toLocaleString()} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visit Details */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Visit Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(VisitType).map((type) => (
                    <option key={type} value={type}>
                      {formatVisitType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(VisitStatus).map((status) => (
                    <option key={status} value={status}>
                      {formatVisitStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={formData.scheduledDate ? formatDateTimeForInput(formData.scheduledDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Agent
                </label>
                <select
                  name="agentId"
                  value={formData.agentId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an agent...</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Notes & Special Instructions
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any special instructions, client preferences, or important notes about this visit..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Update Visit' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitForm;