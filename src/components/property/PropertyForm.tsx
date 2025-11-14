import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, User, Camera, Video } from 'lucide-react';
import { Property, PropertyStatus, PropertyType, PropertyCondition, TransactionType, Client, ClientRole } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';
import api from '../../config/api';

interface PropertyFormProps {
  onSubmit: (data: Partial<Property>) => void;
  onClose: () => void;
  initialData?: Partial<Property>;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const [formData, setFormData] = useState<Partial<Property>>(
    initialData || {
      propertyId: '',
      title: '',
      type: PropertyType.APARTMENT,
      condition: PropertyCondition.GOOD_CONDITION,
      transactionType: TransactionType.SALE,
      surface: 0,
      price: 0,
      location: '',
      status: PropertyStatus.AVAILABLE,
      description: '',
      features: [],
      photos: [],
      videos: [],
      rooms: 0,
      ownerId: '',
    }
  );

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string>('');
  const [videoUrls, setVideoUrls] = useState<string>('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients', {
          params: { role: 'owner' }
        });
        setAvailableClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        // Fallback to local storage
        const ownerClients = clients.filter(client => client.role === ClientRole.OWNER);
        setAvailableClients(ownerClients);
      }
    };

    fetchClients();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'surface' || name === 'price' || name === 'rooms' ? Number(value) : value,
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features || [];
    
    if (currentFeatures.includes(feature)) {
      setFormData({
        ...formData,
        features: currentFeatures.filter(f => f !== feature),
      });
    } else {
      setFormData({
        ...formData,
        features: [...currentFeatures, feature],
      });
    }
  };

  const handleLocationSelect = (location: string) => {
    setFormData({
      ...formData,
      location
    });
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingVideos(true);
      
      // Store the files for later submission
      const newVideoFiles = Array.from(files);
      setVideoFiles([...videoFiles, ...newVideoFiles]);
      
      // Create preview URLs
      const newVideoPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData({
        ...formData,
        videos: [...(formData.videos || []), ...newVideoPreviews],
      });
      
      setUploadingVideos(false);
    }
  };

  const handleAddPhotos = () => {
    if (photoUrls.trim()) {
      const urls = photoUrls.split('\n').filter(url => url.trim() !== '');
      setFormData({
        ...formData,
        photos: [...(formData.photos || []), ...urls],
      });
      setPhotoUrls('');
    }
  };

  const handleAddVideos = () => {
    if (videoUrls.trim()) {
      const urls = videoUrls.split('\n').filter(url => url.trim() !== '');
      setFormData({
        ...formData,
        videos: [...(formData.videos || []), ...urls],
      });
      setVideoUrls('');
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

  const handleRemoveVideo = (index: number) => {
    if (formData.videos) {
      // Remove from preview
      const updatedVideos = formData.videos.filter((_, i) => i !== index);
      
      // Remove from files if it's a new upload
      if (index < videoFiles.length) {
        const updatedVideoFiles = [...videoFiles];
        updatedVideoFiles.splice(index, 1);
        setVideoFiles(updatedVideoFiles);
      }
      
      setFormData({
        ...formData,
        videos: updatedVideos,
      });
    }
  };

  const generatePropertyId = () => {
    const prefix = 'PROP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate property ID if not provided
    const finalData = {
      ...formData,
      propertyId: formData.propertyId || generatePropertyId(),
    };
    
    try {
      // If we have files to upload, we need to use FormData
      if (photoFiles.length > 0 || videoFiles.length > 0 || initialData) {
        const formDataObj = new FormData();
        
        // Add all property data
        Object.entries(finalData).forEach(([key, value]) => {
          if (key !== 'photos' && key !== 'videos') {
            if (key === 'features' && Array.isArray(value)) {
              formDataObj.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
              formDataObj.append(key, String(value));
            }
          }
        });
        
        // Convert camelCase to snake_case for API
        if (finalData.propertyId) formDataObj.set('property_id', finalData.propertyId);
        if (finalData.ownerId) formDataObj.set('owner_id', finalData.ownerId);
        if (finalData.transactionType) formDataObj.set('transaction_type', finalData.transactionType);
        if (finalData.condition) formDataObj.set('condition_status', finalData.condition);
        
        // Add photo files
        photoFiles.forEach(file => {
          formDataObj.append('photos', file);
        });
        
        // Add video files
        videoFiles.forEach(file => {
          formDataObj.append('videos', file);
        });
        
        // Submit to API
        try {
          if (initialData?.id) {
            await api.put(`/properties/${initialData.id}`, formDataObj);
          } else {
            await api.post('/properties', formDataObj);
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          throw new Error('Failed to save property to API');
        }
      }
      
      // Call the onSubmit callback with the final data
      onSubmit(finalData);
    } catch (error) {
      console.error('Error saving property:', error);
      alert('There was an error saving the property. Please try again.');
    }
  };

  const formatConditionLabel = (condition: PropertyCondition) => {
    switch (condition) {
      case PropertyCondition.NEW:
        return 'New';
      case PropertyCondition.RENOVATED:
        return 'Renovated';
      case PropertyCondition.GOOD_CONDITION:
        return 'Good Condition';
      case PropertyCondition.TO_RENOVATE:
        return 'To Renovate';
      default:
        return condition;
    }
  };

  const formatTransactionLabel = (transaction: TransactionType) => {
    switch (transaction) {
      case TransactionType.SALE:
        return 'Sale';
      case TransactionType.RENTAL:
        return 'Rental';
      case TransactionType.SEASONAL_RENTAL:
        return 'Seasonal Rental';
      default:
        return transaction;
    }
  };

  const getSelectedOwner = () => {
    return availableClients.find(client => client.id === formData.ownerId);
  };

  // Predefined features
  const predefinedFeatures = [
    'Swimming Pool',
    'Garage',
    'Elevator',
    'Garden',
    'Terrace',
    'Sea View',
    'Central Heating',
    'Double Glazing',
    'Insulation',
    'Fully Equipped Kitchen'
  ];

  // Predefined locations
  const predefinedLocations = [
    'Casablanca, City Center',
    'Casablanca, Anfa',
    'Casablanca, Maarif',
    'Rabat, Hassan',
    'Rabat, Agdal',
    'Rabat, Souissi',
    'Marrakech, Gueliz',
    'Marrakech, Hivernage',
    'Tangier, Beach Area',
    'Agadir, Suburbs'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Property ID and Owner */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property ID *
                </label>
                <input
                  type="text"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleInputChange}
                  placeholder="Enter property ID or leave blank to auto-generate"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to auto-generate (e.g., PROP-123456)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Owner
                </label>
                {availableClients.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      name="ownerId"
                      value={formData.ownerId}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No owners available</option>
                    </select>
                    <a 
                      href="/clients" 
                      target="_blank" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add a new owner client first
                    </a>
                  </div>
                ) : (
                  <select
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Owner</option>
                    {availableClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                )}
                {getSelectedOwner() && (
                  <div className="mt-2 p-2 bg-white rounded border flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium">{getSelectedOwner()?.name}</p>
                      <p className="text-gray-600">{getSelectedOwner()?.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(PropertyType).map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(PropertyCondition).map((condition) => (
                    <option key={condition} value={condition}>
                      {formatConditionLabel(condition)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(TransactionType).map((transaction) => (
                    <option key={transaction} value={transaction}>
                      {formatTransactionLabel(transaction)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surface (m²) *
                </label>
                <input
                  type="number"
                  name="surface"
                  value={formData.surface}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (MAD) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  list="location-suggestions"
                />
                <datalist id="location-suggestions">
                  {predefinedLocations.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
                <div className="mt-2 flex flex-wrap gap-2">
                  {predefinedLocations.slice(0, 4).map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors"
                    >
                      {location}
                    </button>
                  ))}
                </div>
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
                  {Object.values(PropertyStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {predefinedFeatures.map((feature) => (
                <div key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`feature-${feature}`}
                    checked={(formData.features || []).includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-gray-700">
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photos
            </label>
            <div className="space-y-4">
              {/* Upload Photos */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                  <Camera size={48} className="text-gray-400 mb-2" />
                  <p className="text-lg font-medium text-gray-700">Upload Photos</p>
                  <p className="text-sm text-gray-500">Click to select multiple images</p>
                </label>
                {uploadingPhotos && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-blue-600 mt-2">Uploading photos...</p>
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
                  onClick={handleAddPhotos}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 self-start"
                >
                  <Upload size={18} />
                  Add URLs
                </button>
              </div>
              
              {/* Photo Preview */}
              {formData.photos && formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Videos
            </label>
            <div className="space-y-4">
              {/* Upload Videos */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Video size={48} className="text-gray-400 mb-2" />
                  <p className="text-lg font-medium text-gray-700">Upload Videos</p>
                  <p className="text-sm text-gray-500">Click to select multiple videos</p>
                </label>
                {uploadingVideos && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-blue-600 mt-2">Uploading videos...</p>
                  </div>
                )}
              </div>

              {/* Add Video URLs */}
              <div className="flex gap-2">
                <textarea
                  value={videoUrls}
                  onChange={(e) => setVideoUrls(e.target.value)}
                  placeholder="Or paste video URLs (one per line)"
                  rows={2}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddVideos}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 self-start"
                >
                  <Upload size={18} />
                  Add URLs
                </button>
              </div>
              
              {/* Video Preview */}
              {formData.videos && formData.videos.length > 0 && (
                <div className="space-y-2">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Video size={20} className="text-blue-600" />
                        <span className="truncate flex-1 text-sm">{video}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
                        className="text-red-500 hover:text-red-600 ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              {initialData ? 'Update Property' : 'Save Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;