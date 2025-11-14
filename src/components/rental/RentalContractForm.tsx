import React, { useState, useEffect } from 'react';
import { X, FileText, User, Home, Calendar, DollarSign } from 'lucide-react';
import { RentalContract, RentalStatus, Client, Property, ClientRole } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';

interface RentalContractFormProps {
  onSubmit: (data: Partial<RentalContract>) => void;
  onClose: () => void;
  initialData?: Partial<RentalContract>;
}

const RentalContractForm: React.FC<RentalContractFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []);
  
  const [formData, setFormData] = useState<Partial<RentalContract>>(
    initialData || {
      propertyId: '',
      tenantId: '',
      ownerId: '',
      startDate: new Date(),
      endDate: new Date(),
      monthlyRent: 0,
      deposit: 0,
      status: RentalStatus.PENDING,
      paymentDay: 1,
      contractTerms: '',
      specialConditions: '',
    }
  );

  // Get available properties for rental
  const availableProperties = properties.filter(p => 
    p.transactionType === 'rental' && (p.status === 'available' || p.id === formData.propertyId)
  );

  // Get tenant clients
  const tenantClients = clients.filter(c => c.role === ClientRole.TENANT);

  // Get owner clients
  const ownerClients = clients.filter(c => c.role === ClientRole.OWNER);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'startDate' || name === 'endDate') {
      setFormData({
        ...formData,
        [name]: new Date(value),
      });
    } else if (name === 'monthlyRent' || name === 'deposit' || name === 'paymentDay') {
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

  // Handle property selection and auto-select owner
  const handlePropertyChange = (propertyId: string) => {
    const selectedProperty = availableProperties.find(p => p.id === propertyId);
    
    setFormData({
      ...formData,
      propertyId,
      ownerId: selectedProperty?.ownerId || '', // Auto-select owner
      monthlyRent: selectedProperty?.price || 0, // Auto-fill rent from property price
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.propertyId || !formData.tenantId || !formData.ownerId) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
      return;
    }

    // Auto-calculate deposit if not set (typically 2x monthly rent)
    if (!formData.deposit && formData.monthlyRent) {
      formData.deposit = formData.monthlyRent * 2;
    }

    onSubmit(formData);
  };

  const getSelectedProperty = () => {
    return availableProperties.find(p => p.id === formData.propertyId);
  };

  const getSelectedTenant = () => {
    return tenantClients.find(c => c.id === formData.tenantId);
  };

  const getSelectedOwner = () => {
    return ownerClients.find(c => c.id === formData.ownerId);
  };

  const formatDateForInput = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  };

  const calculateEndDate = (startDate: Date, months: number) => {
    if (typeof startDate === 'string') {
      startDate = new Date(startDate);
    }
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Rental Contract' : 'New Rental Contract'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Property Selection */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Home size={20} />
              Property Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property *
                </label>
                {availableProperties.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={(e) => handlePropertyChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">No rental properties available</option>
                    </select>
                    <a 
                      href="/properties" 
                      target="_blank" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add a rental property first
                    </a>
                  </div>
                ) : (
                  <select
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={(e) => handlePropertyChange(e.target.value)}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Owner *
                </label>
                <select
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                  disabled={!formData.propertyId}
                >
                  <option value="">Auto-selected from property...</option>
                  {ownerClients.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} - {owner.phone}
                    </option>
                  ))}
                </select>
                {formData.propertyId && !formData.ownerId && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ Selected property has no owner assigned. Please select manually.
                  </p>
                )}
              </div>
            </div>

            {getSelectedProperty() && (
              <div className="mt-4 p-4 bg-white rounded border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Property</p>
                    <p className="text-gray-600">{getSelectedProperty()!.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{getSelectedProperty()!.location}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Surface</p>
                    <p className="text-gray-600">{getSelectedProperty()!.surface} m²</p>
                  </div>
                </div>
                {getSelectedOwner() && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-green-700">✓ Owner Auto-Selected:</p>
                    <p className="text-sm text-gray-600">{getSelectedOwner()!.name} - {getSelectedOwner()!.phone}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tenant Selection */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Tenant Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant *
              </label>
              {tenantClients.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <select
                    name="tenantId"
                    value={formData.tenantId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">No tenant clients available</option>
                  </select>
                  <a 
                    href="/clients" 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add a tenant client first
                  </a>
                </div>
              ) : (
                <select
                  name="tenantId"
                  value={formData.tenantId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a tenant...</option>
                  {tenantClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.phone} - {client.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {getSelectedTenant() && (
              <div className="mt-4 p-4 bg-white rounded border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-800 font-semibold">
                      {getSelectedTenant()!.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getSelectedTenant()!.name}</p>
                    <p className="text-sm text-gray-600">{getSelectedTenant()!.email}</p>
                    <p className="text-sm text-gray-600">{getSelectedTenant()!.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Terms */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Contract Terms
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate ? formatDateForInput(formData.startDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate ? formatDateForInput(formData.endDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => formData.startDate && setFormData({
                      ...formData,
                      endDate: calculateEndDate(formData.startDate, 12)
                    })}
                    className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => formData.startDate && setFormData({
                      ...formData,
                      endDate: calculateEndDate(formData.startDate, 24)
                    })}
                    className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    +2 Years
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (MAD) *
                </label>
                <input
                  type="number"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
                {getSelectedProperty() && formData.monthlyRent !== getSelectedProperty()!.price && (
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      monthlyRent: getSelectedProperty()!.price
                    })}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Use property price ({getSelectedProperty()!.price.toLocaleString()} MAD)
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit (MAD) *
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {formData.monthlyRent ? (formData.monthlyRent * 2).toLocaleString() : '0'} MAD (2x monthly rent)
                </p>
                {formData.monthlyRent && formData.deposit !== formData.monthlyRent * 2 && (
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      deposit: formData.monthlyRent! * 2
                    })}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Use suggested amount
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Due Day *
                </label>
                <select
                  name="paymentDay"
                  value={formData.paymentDay}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(RentalStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contract Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Terms & Conditions
                </label>
                <textarea
                  name="contractTerms"
                  value={formData.contractTerms}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Standard terms and conditions for the rental agreement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Conditions
                </label>
                <textarea
                  name="specialConditions"
                  value={formData.specialConditions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special conditions or clauses specific to this rental..."
                />
              </div>
            </div>
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
              {initialData ? 'Update Contract' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalContractForm;