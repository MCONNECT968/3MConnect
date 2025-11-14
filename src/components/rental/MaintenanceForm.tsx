import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertTriangle, Camera, Upload, Trash2 } from 'lucide-react';
import { MaintenanceRequest, MaintenanceCategory, MaintenancePriority, MaintenanceStatus, Client, Property } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';
import api from '../../config/api';

interface MaintenanceFormProps {
  onSubmit: (data: Partial<MaintenanceRequest>) => void;
  onClose: () => void;
  initialData?: Partial<MaintenanceRequest>;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []);
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const [rentalContracts, setRentalContracts] = useLocalStorage<any[]>(STORAGE_KEYS.RENTAL_CONTRACTS, []);
  
  const [formData, setFormData] = useState<Partial<MaintenanceRequest>>(
    initialData || {
      propertyId: '',
      contractId: '',
      tenantId: '',
      title: '',
      description: '',
      category: MaintenanceCategory.OTHER,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.REPORTED,
      reportedDate: new Date(),
      scheduledDate: undefined,
      cost: undefined,
      assignedTo: '',
      photos: [],
      notes: '',
    }
  );

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string>('');
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableContracts, setAvailableContracts] = useState<any[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Use the property and client services from firebaseService
        setAvailableProperties(properties);
        setAvailableClients(clients);
        setAvailableContracts(rentalContracts);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to local storage
        setAvailableProperties(properties);
        setAvailableClients(clients);
        setAvailableContracts(rentalContracts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'reportedDate' || name === 'scheduledDate') {
      setFormData({
        ...formData,
        [name]: value ? new Date(value) : undefined,
      });
    } else if (name === 'cost') {
      setFormData({
        ...formData,
        [name]: value ? Number(value) : undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = availableContracts.find(c => c.id === contractId);
    if (contract) {
      setFormData({
        ...formData,
        contractId,
        propertyId: contract.property_id,
        tenantId: contract.tenant_id,
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingPhotos(true);
      
      // Store the files for later submission
      const newPhotoFiles = Array.from(files);
      setPhotoFiles([...photoFiles, ...newPhotoFiles]);
      
      // Create preview URLs
      const newPhotoPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData({
        ...formData,
        photos: [...(formData.photos || []), ...newPhotoPreviews],
      });
      
      setUploadingPhotos(false);
    }
  };

  const handleAddPhotoUrls = () => {
    if (photoUrls.trim()) {
      const urls = photoUrls.split('\n').filter(url => url.trim() !== '');
      setFormData({
        ...formData,
        photos: [...(formData.photos || []), ...urls],
      });
      setPhotoUrls('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (formData.photos) {
      // Remove from preview
      const updatedPhotos = formData.photos.filter((_, i) => i !== index);
      
      // Remove from files if it's a new upload
      if (index < photoFiles.length) {
        const updatedPhotoFiles = [...photoFiles];
        updatedPhotoFiles.splice(index, 1);
        setPhotoFiles(updatedPhotoFiles);
      }
      
      setFormData({
        ...formData,
        photos: updatedPhotos,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.propertyId || !formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Add or update maintenance request in Firebase
      if (initialData?.id) {
        await maintenanceService.updateMaintenanceRequest(initialData.id, formData);
      } else {
        await maintenanceService.addMaintenanceRequest(formData);
      }
      
      // Call the onSubmit callback with the final data
      onSubmit(formData);
    } catch (error) {
      console.error('Error saving maintenance request:', error);
      alert('There was an error saving the maintenance request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedContract = () => {
    return availableContracts.find(c => c.id === formData.contractId);
  };

  const getTenantInfo = () => {
    if (!formData.tenantId) return null;
    return availableClients.find(c => c.id === formData.tenantId);
  };

  const getPropertyInfo = () => {
    if (!formData.propertyId) return null;
    return availableProperties.find(p => p.id === formData.propertyId);
  };

  const formatDateForInput = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  };

  const formatCategoryLabel = (category: MaintenanceCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatPriorityLabel = (priority: MaintenancePriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatStatusLabel = (status: MaintenanceStatus) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Maintenance Request' : 'Report Maintenance Issue'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Property/Contract Selection */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Wrench size={20} />
              Property Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Rental Contract
              </label>
              {availableContracts.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <select
                    value={formData.contractId || ''}
                    onChange={(e) => handleContractChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No contracts available</option>
                  </select>
                  <a 
                    href="/rental-management" 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Create a rental contract first
                  </a>
                </div>
              ) : (
                <select
                  value={formData.contractId || ''}
                  onChange={(e) => handleContractChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a contract (optional)...</option>
                  {availableContracts.map((contract) => {
                    const tenant = availableClients.find(c => c.id === contract.tenant_id);
                    const property = availableProperties.find(p => p.id === contract.property_id);
                    return (
                      <option key={contract.id} value={contract.id}>
                        {tenant?.name || 'Unknown'} - {property?.title || 'Unknown Property'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {!formData.contractId && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property Directly *
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
                        {property.title} - {property.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {(getSelectedContract() || getPropertyInfo()) && (
              <div className="mt-4 p-4 bg-white rounded border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Property</p>
                    <p className="text-gray-600">{getPropertyInfo()?.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{getPropertyInfo()?.location}</p>
                  </div>
                  {getTenantInfo() && (
                    <>
                      <div>
                        <p className="font-medium text-gray-700">Tenant</p>
                        <p className="text-gray-600">{getTenantInfo()?.name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Contact</p>
                        <p className="text-gray-600">{getTenantInfo()?.phone}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Issue Details */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Issue Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Provide detailed information about the maintenance issue..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {Object.values(MaintenanceCategory).map((category) => (
                      <option key={category} value={category}>
                        {formatCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {Object.values(MaintenancePriority).map((priority) => (
                      <option key={priority} value={priority}>
                        {formatPriorityLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <Camera size={20} />
              Photos & Documentation
            </h3>
            
            <div className="space-y-4">
              {/* Upload Photos */}
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera size={48} className="text-amber-400 mb-2" />
                  <p className="text-lg font-medium text-amber-700">Upload Photos</p>
                  <p className="text-sm text-amber-600">Click to select multiple images of the issue</p>
                </label>
                {uploadingPhotos && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-sm text-amber-600 mt-2">Uploading photos...</p>
                  </div>
                )}
              </div>

              {/* Add Photo URLs */}
              <div className="flex gap-2">
                <textarea
                  value={photoUrls}
                  onChange={(e) => setPhotoUrls(e.target.value)}
                  placeholder="Or paste photo URLs (one per line)"
                  rows={3}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrls}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2 self-start"
                >
                  <Upload size={18} />
                  Add URLs
                </button>
              </div>
              
              {/* Photo Preview */}
              {formData.photos && formData.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Photos ({formData.photos.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Maintenance issue photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Management Details */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Management Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {Object.values(MaintenanceStatus).map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reported Date *
                </label>
                <input
                  type="date"
                  name="reportedDate"
                  value={formData.reportedDate ? formatDateForInput(formData.reportedDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate ? formatDateForInput(formData.scheduledDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (MAD)
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <input
                  type="text"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name of technician or contractor"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information or special instructions..."
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
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {initialData ? 'Update Request' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;