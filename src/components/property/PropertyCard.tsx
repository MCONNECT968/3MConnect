import React from 'react';
import { MapPin, Home, ArrowRight, User } from 'lucide-react';
import { Property, PropertyStatus, TransactionType } from '../../types';
import { clients } from '../../data/mockData';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const statusColors = {
    [PropertyStatus.AVAILABLE]: 'bg-green-100 text-green-800',
    [PropertyStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PropertyStatus.SOLD]: 'bg-blue-100 text-blue-800',
    [PropertyStatus.RENTED]: 'bg-purple-100 text-purple-800',
    [PropertyStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPriceLabel = () => {
    switch (property.transactionType) {
      case TransactionType.RENTAL:
        return '/month';
      case TransactionType.SEASONAL_RENTAL:
        return '/season';
      default:
        return '';
    }
  };

  const getPropertyOwner = () => {
    return clients.find(client => client.id === property.ownerId);
  };

  const owner = getPropertyOwner();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-48">
        <img 
          src={property.photos[0] || 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg'} 
          alt={property.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[property.status]}`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
        <div className="absolute top-2 left-2">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
            {property.propertyId}
          </span>
        </div>
        {property.photos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            +{property.photos.length - 1} photos
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">{property.title}</h3>
        
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.location}</span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Home size={16} className="mr-1" />
            <span className="text-sm capitalize">{property.type}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span>{property.surface} m²</span>
            {property.rooms && property.rooms > 0 && (
              <span>{property.rooms} rooms</span>
            )}
          </div>
        </div>

        {/* Owner Info */}
        {owner && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <User size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300">{owner.name}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-400">
              {formatPrice(property.price)}
            </span>
            {getPriceLabel() && (
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{getPriceLabel()}</span>
            )}
          </div>
          
          <button className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-colors">
            {t('common.details')} <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;