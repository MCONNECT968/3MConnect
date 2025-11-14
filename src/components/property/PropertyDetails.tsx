import React, { useState } from 'react';
import { X, MapPin, Home, Calendar, Eye, Share2, Edit, Trash2, ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ExternalLink, User } from 'lucide-react';
import { Property, PropertyStatus, PropertyCondition, TransactionType } from '../../types';
import { clients } from '../../data/mockData';

interface PropertyDetailsProps {
  property: Property;
  onClose: () => void;
  onEdit?: (property: Property) => void;
  onDelete?: (propertyId: string) => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ 
  property, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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

  const formatCondition = (condition: PropertyCondition) => {
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

  const formatTransactionType = (transaction: TransactionType) => {
    switch (transaction) {
      case TransactionType.SALE:
        return 'For Sale';
      case TransactionType.RENTAL:
        return 'For Rent';
      case TransactionType.SEASONAL_RENTAL:
        return 'Seasonal Rental';
      default:
        return transaction;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getPropertyOwner = () => {
    if (!property.ownerId) return null;
    return clients.find(client => client.id === property.ownerId);
  };

  const nextPhoto = () => {
    if (property.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (property.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: window.location.href,
        });
      } catch (error) {
        // If Web Share API fails, fall back to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Property link copied to clipboard!');
        } catch (clipboardError) {
          alert('Unable to share or copy link. Please copy the URL manually.');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Property link copied to clipboard!');
      } catch (error) {
        alert('Unable to copy link to clipboard. Please copy the URL manually.');
      }
    }
  };

  const handleCallNow = () => {
    const owner = getPropertyOwner();
    if (owner) {
      window.location.href = `tel:${owner.phone}`;
    } else {
      alert('Owner contact information not available');
    }
  };

  const handleWhatsApp = () => {
    const owner = getPropertyOwner();
    if (owner) {
      const message = encodeURIComponent(`Hi, I'm interested in your property: ${property.title} (${property.propertyId})`);
      const phoneNumber = owner.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      alert('Owner contact information not available');
    }
  };

  const handleSendEmail = () => {
    const owner = getPropertyOwner();
    if (owner) {
      const subject = encodeURIComponent(`Inquiry about ${property.title}`);
      const body = encodeURIComponent(`Hi,\n\nI'm interested in your property:\n\nProperty: ${property.title}\nID: ${property.propertyId}\nLocation: ${property.location}\nPrice: ${formatPrice(property.price)}\n\nPlease contact me for more information.\n\nBest regards`);
      window.location.href = `mailto:${owner.email}?subject=${subject}&body=${body}`;
    } else {
      alert('Owner contact information not available');
    }
  };

  const handleScheduleViewing = () => {
    alert('Schedule viewing functionality would be implemented here');
  };

  const handleGenerateBrochure = () => {
    alert('Generate brochure functionality would be implemented here');
  };

  const handleAddToFavorites = () => {
    alert('Add to favorites functionality would be implemented here');
  };

  const handleViewOnMap = () => {
    const encodedLocation = encodeURIComponent(property.location);
    window.open(`https://www.google.com/maps/search/${encodedLocation}`, '_blank');
  };

  const handleShareToAvito = () => {
    // Simulate sharing to Avito
    const avitoData = {
      title: property.title,
      price: property.price,
      location: property.location,
      description: property.description,
      photos: property.photos,
    };
    
    console.log('Sharing to Avito:', avitoData);
    alert('Property shared to Avito successfully! (This is a simulation)');
  };

  const handleShareToMubawab = () => {
    // Simulate sharing to Mubawab
    const mubawabData = {
      title: property.title,
      price: property.price,
      location: property.location,
      description: property.description,
      photos: property.photos,
    };
    
    console.log('Sharing to Mubawab:', mubawabData);
    alert('Property shared to Mubawab successfully! (This is a simulation)');
  };

  const owner = getPropertyOwner();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
              <p className="text-sm text-gray-600">ID: {property.propertyId}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[property.status]}`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Share Property"
            >
              <Share2 size={20} />
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(property)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Property"
              >
                <Edit size={20} />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(property.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Property"
              >
                <Trash2 size={20} />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Photo Gallery */}
          {property.photos.length > 0 && (
            <div className="mb-8">
              <div className="relative">
                <img
                  src={property.photos[currentPhotoIndex]}
                  alt={`${property.title} - Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
                  }}
                />
                
                {property.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {property.photos.length}
                    </div>
                  </>
                )}
              </div>
              
              {property.photos.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {property.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        index === currentPhotoIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price and Basic Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="text-3xl font-bold text-blue-900">
                    {formatPrice(property.price)}
                    {property.transactionType === TransactionType.RENTAL && (
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    )}
                    {property.transactionType === TransactionType.SEASONAL_RENTAL && (
                      <span className="text-lg font-normal text-gray-600">/season</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Home size={18} />
                      <span>{property.surface} m²</span>
                    </div>
                    {property.rooms && property.rooms > 0 && (
                      <div className="flex items-center gap-1">
                        <span>{property.rooms} rooms</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin size={18} />
                      <span>{property.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{property.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <p className="font-medium">{formatCondition(property.condition)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction:</span>
                    <p className="font-medium">{formatTransactionType(property.transactionType)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{property.status}</p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              {owner && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3 text-blue-900">Property Owner</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-blue-800" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{owner.name}</p>
                      <p className="text-sm text-gray-600">{owner.email}</p>
                      <p className="text-sm text-gray-600">{owner.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Features */}
              {property.features.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded-md"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {property.videos.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Videos</h3>
                  <div className="space-y-3">
                    {property.videos.map((video, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate flex-1">
                            Video {index + 1}: {video}
                          </span>
                          <a
                            href={video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Eye size={16} />
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Owner</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleCallNow}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Call Now
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Send Email
                  </button>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property ID:</span>
                    <span className="font-medium">#{property.propertyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="font-medium">{formatDate(property.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">{formatDate(property.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Photos:</span>
                    <span className="font-medium">{property.photos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Videos:</span>
                    <span className="font-medium">{property.videos.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleScheduleViewing}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Schedule Viewing
                  </button>
                  <button
                    onClick={handleGenerateBrochure}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Generate Brochure
                  </button>
                  <button
                    onClick={handleAddToFavorites}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Add to Favorites
                  </button>
                  <button
                    onClick={handleViewOnMap}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    View on Map
                  </button>
                </div>
              </div>

              {/* Share to Platforms */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-900">Share Property</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleShareToAvito}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Share to Avito
                  </button>
                  <button
                    onClick={handleShareToMubawab}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Share to Mubawab
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  Share this property to your Avito and Mubawab accounts with one click
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;