import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Tag, DollarSign, Calendar, FileText } from 'lucide-react';
import { Client, ClientRole, ClientStatus, ContactMethod, UrgencyLevel, PropertyType } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';

interface ClientFormProps {
  onSubmit: (data: Partial<Client>) => void;
  onClose: () => void;
  initialData?: Partial<Client>;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [users, setUsers] = useLocalStorage<any[]>(STORAGE_KEYS.USERS, []);
  const [formData, setFormData] = useState<Partial<Client>>(
    initialData || {
      name: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      address: '',
      role: ClientRole.BUYER,
      status: ClientStatus.PROSPECT,
      tags: [],
      budget: 0,
      preferredContactMethod: ContactMethod.PHONE,
      source: '',
      assignedAgent: '',
      notes: '',
    }
  );

  const [newTag, setNewTag] = useState('');
  const [showNeedsForm, setShowNeedsForm] = useState(false);
  const [needsData, setNeedsData] = useState({
    propertyType: [] as PropertyType[],
    minSurface: 0,
    maxSurface: 0,
    minPrice: 0,
    maxPrice: 0,
    locations: [] as string[],
    features: [] as string[],
    notes: '',
    urgency: UrgencyLevel.MEDIUM,
    timeline: '',
  });

  const [newLocation, setNewLocation] = useState('');
  const [newFeature, setNewFeature] = useState('');

  // Predefined tags
  const predefinedTags = [
    'VIP', 
    'High Budget', 
    'Urgent', 
    'Investor', 
    'First-time Buyer',
    'Cash Buyer',
    'Foreigner',
    'Referral',
    'Long-term'
  ];

  // Predefined sources
  const predefinedSources = [
    'Website',
    'Referral',
    'Walk-in',
    'Phone Inquiry',
    'Social Media',
    'Avito',
    'Mubawab',
    'Event',
    'Partner Agency'
  ];

  // Initialize needs form if client has needs
  useEffect(() => {
    if (initialData?.needs) {
      setShowNeedsForm(true);
      setNeedsData({
        propertyType: initialData.needs.propertyType || [],
        minSurface: initialData.needs.minSurface || 0,
        maxSurface: initialData.needs.maxSurface || 0,
        minPrice: initialData.needs.minPrice || 0,
        maxPrice: initialData.needs.maxPrice || 0,
        locations: initialData.needs.locations || [],
        features: initialData.needs.features || [],
        notes: initialData.needs.notes || '',
        urgency: initialData.needs.urgency || UrgencyLevel.MEDIUM,
        timeline: initialData.needs.timeline || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'budget' ? Number(value) : value,
    });
  };

  const handleNeedsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNeedsData({
      ...needsData,
      [name]: name.includes('min') || name.includes('max') ? Number(value) : value,
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() !== '' && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleAddPredefinedTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  const handlePropertyTypeChange = (type: PropertyType) => {
    const currentTypes = needsData.propertyType || [];
    
    if (currentTypes.includes(type)) {
      setNeedsData({
        ...needsData,
        propertyType: currentTypes.filter((t) => t !== type),
      });
    } else {
      setNeedsData({
        ...needsData,
        propertyType: [...currentTypes, type],
      });
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim() !== '' && !needsData.locations.includes(newLocation.trim())) {
      setNeedsData({
        ...needsData,
        locations: [...needsData.locations, newLocation.trim()],
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setNeedsData({
      ...needsData,
      locations: needsData.locations.filter((loc) => loc !== location),
    });
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== '' && !needsData.features.includes(newFeature.trim())) {
      setNeedsData({
        ...needsData,
        features: [...needsData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setNeedsData({
      ...needsData,
      features: needsData.features.filter((feat) => feat !== feature),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form data before submission:', formData);
    console.log('Needs data before submission:', needsData);
    
    const finalData = {
      ...formData,
      needs: showNeedsForm && (formData.role === ClientRole.BUYER || formData.role === ClientRole.TENANT) ? {
        id: initialData?.needs?.id || Date.now().toString(),
        ...needsData,
      } : undefined,
    };
    
    console.log('Final data for submission:', finalData);
    onSubmit(finalData);
  };

  const shouldShowNeeds = () => {
    return formData.role === ClientRole.BUYER || formData.role === ClientRole.TENANT;
  };

  const formatRoleLabel = (role: ClientRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatStatusLabel = (status: ClientStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatContactMethodLabel = (method: ContactMethod) => {
    switch (method) {
      case ContactMethod.IN_PERSON:
        return 'In Person';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Client Classification */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Tag size={20} />
              Client Classification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(ClientRole).map((role) => (
                    <option key={role} value={role}>
                      {formatRoleLabel(role)}
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
                  {Object.values(ClientStatus).map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (MAD)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(ContactMethod).map((method) => (
                    <option key={method} value={method}>
                      {formatContactMethodLabel(method)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select source...</option>
                  {predefinedSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Agent
                </label>
                <select
                  name="assignedAgent"
                  value={formData.assignedAgent}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select agent...</option>
                  {users.filter(user => user.role === 'agent' || user.role === 'admin').map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {predefinedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddPredefinedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    (formData.tags || []).includes(tag)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map((tag, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-800 hover:text-blue-900"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this client..."
            />
          </div>

          {/* Client Needs (for buyers and tenants) */}
          {shouldShowNeeds() && (
            <div className="bg-amber-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                  <FileText size={20} />
                  Client Needs & Requirements
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNeedsForm(!showNeedsForm)}
                  className="text-amber-700 hover:text-amber-900 font-medium"
                >
                  {showNeedsForm ? 'Hide' : 'Show'} Needs Form
                </button>
              </div>

              {showNeedsForm && (
                <div className="space-y-6">
                  {/* Property Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Types</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.values(PropertyType).map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`needs-type-${type}`}
                            checked={needsData.propertyType.includes(type)}
                            onChange={() => handlePropertyTypeChange(type)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor={`needs-type-${type}`} className="ml-2 text-sm text-gray-700 capitalize">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price and Surface Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Surface (m²) *
                      </label>
                      <input
                        type="number"
                        id="minSurface"
                        name="minSurface"
                        value={needsData.minSurface || ''}
                        onChange={handleNeedsChange}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Surface (m²) *
                      </label>
                      <input
                        type="number"
                        id="maxSurface"
                        name="maxSurface"
                        value={needsData.maxSurface || ''}
                        onChange={handleNeedsChange}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Price (MAD) *
                      </label>
                      <input
                        type="number"
                        id="minPrice"
                        name="minPrice"
                        value={needsData.minPrice || ''}
                        onChange={handleNeedsChange}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Price (MAD) *
                      </label>
                      <input
                        type="number"
                        id="maxPrice"
                        name="maxPrice"
                        value={needsData.maxPrice || ''}
                        onChange={handleNeedsChange}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Locations</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Add location"
                        className="flex-1 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                      />
                      <button
                        type="button"
                        onClick={handleAddLocation}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {needsData.locations.map((location, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                          <span>{location}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(location)}
                            className="ml-2 text-blue-800 hover:text-blue-900"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Features</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add feature"
                        className="flex-1 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {needsData.features.map((feature, index) => (
                        <div key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(feature)}
                            className="ml-2 text-green-800 hover:text-green-900"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Urgency and Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                      <select
                        name="urgency"
                        value={needsData.urgency}
                        onChange={handleNeedsChange}
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.values(UrgencyLevel).map((level) => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                      <input
                        type="text"
                        name="timeline"
                        value={needsData.timeline}
                        onChange={handleNeedsChange}
                        placeholder="e.g., 3-6 months, ASAP"
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Needs Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements</label>
                    <textarea
                      name="notes"
                      value={needsData.notes}
                      onChange={handleNeedsChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any specific requirements or preferences..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              {initialData ? 'Update Client' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;