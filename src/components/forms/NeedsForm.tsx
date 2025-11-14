import React, { useState } from 'react';
import { ClientNeeds, PropertyType, UrgencyLevel } from '../../types';

interface NeedsFormProps {
  initialData?: ClientNeeds;
  onSubmit: (data: ClientNeeds) => void;
}

const NeedsForm: React.FC<NeedsFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<ClientNeeds>>(
    initialData || {
      propertyType: [],
      minSurface: 0,
      maxSurface: 0,
      minPrice: 0,
      maxPrice: 0,
      locations: [],
      features: [],
      notes: '',
      urgency: UrgencyLevel.MEDIUM,
      timeline: '',
    }
  );

  const [newLocation, setNewLocation] = useState('');
  const [newFeature, setNewFeature] = useState('');

  const handlePropertyTypeChange = (type: PropertyType) => {
    const currentTypes = formData.propertyType || [];
    
    if (currentTypes.includes(type)) {
      setFormData({
        ...formData,
        propertyType: currentTypes.filter((t) => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        propertyType: [...currentTypes, type],
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes('min') || name.includes('max') ? Number(value) : value,
    });
  };

  const handleAddLocation = () => {
    if (newLocation.trim() !== '') {
      setFormData({
        ...formData,
        locations: [...(formData.locations || []), newLocation.trim()],
      });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFormData({
      ...formData,
      locations: (formData.locations || []).filter((loc) => loc !== location),
    });
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== '') {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((feat) => feat !== feature),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData: ClientNeeds = {
      id: initialData?.id || Date.now().toString(),
      propertyType: formData.propertyType || [],
      minSurface: formData.minSurface || 0,
      maxSurface: formData.maxSurface || 0,
      minPrice: formData.minPrice || 0,
      maxPrice: formData.maxPrice || 0,
      locations: formData.locations || [],
      features: formData.features || [],
      notes: formData.notes || '',
      urgency: formData.urgency || UrgencyLevel.MEDIUM,
      timeline: formData.timeline || '',
    };
    
    onSubmit(finalData);
  };

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
    'Fully Equipped Kitchen',
    'Furnished',
    'Internet Ready',
    'Parking',
    'Security',
    'Near Schools',
    'Near Transport'
  ];

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Types */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Property Requirements</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Property Type *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(PropertyType).map((type) => (
              <div key={type} className="flex items-center">
                <input
                  type="checkbox"
                  id={`type-${type}`}
                  checked={(formData.propertyType || []).includes(type)}
                  onChange={() => handlePropertyTypeChange(type)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 capitalize">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="minSurface" className="block text-sm font-medium text-gray-700 mb-1">
              Min Surface (m²) *
            </label>
            <input
              type="number"
              id="minSurface"
              name="minSurface"
              value={formData.minSurface || ''}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="maxSurface" className="block text-sm font-medium text-gray-700 mb-1">
              Max Surface (m²) *
            </label>
            <input
              type="number"
              id="maxSurface"
              name="maxSurface"
              value={formData.maxSurface || ''}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Min Price (MAD) *
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={formData.minPrice || ''}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Max Price (MAD) *
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={formData.maxPrice || ''}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Preferred Locations</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Locations</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {predefinedLocations.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => {
                  if (!(formData.locations || []).includes(location)) {
                    setFormData({
                      ...formData,
                      locations: [...(formData.locations || []), location],
                    });
                  }
                }}
                className={`text-left p-2 rounded text-sm transition-colors ${
                  (formData.locations || []).includes(location)
                    ? 'bg-green-200 text-green-800'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        <div className="flex mb-3">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Add custom location"
            className="flex-1 rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
          />
          <button
            type="button"
            onClick={handleAddLocation}
            className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(formData.locations || []).map((location, index) => (
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
      <div className="bg-amber-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Required Features</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Features</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {predefinedFeatures.map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => {
                  if (!(formData.features || []).includes(feature)) {
                    setFormData({
                      ...formData,
                      features: [...(formData.features || []), feature],
                    });
                  }
                }}
                className={`text-left p-2 rounded text-sm transition-colors ${
                  (formData.features || []).includes(feature)
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {feature}
              </button>
            ))}
          </div>
        </div>

        <div className="flex mb-3">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Add custom feature"
            className="flex-1 rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(formData.features || []).map((feature, index) => (
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

      {/* Priority and Timeline */}
      <div className="bg-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Priority & Timeline</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Level *
            </label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.values(UrgencyLevel).map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
              Timeline
            </label>
            <input
              type="text"
              id="timeline"
              name="timeline"
              value={formData.timeline || ''}
              onChange={handleInputChange}
              placeholder="e.g., 3-6 months, ASAP, End of year"
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes & Special Requirements
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Any specific requirements, preferences, or additional information..."
          className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          Save Client Requirements
        </button>
      </div>
    </form>
  );
};

export default NeedsForm;