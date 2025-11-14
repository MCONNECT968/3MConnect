import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Tag, User, Calendar, MessageCircle, Edit, Trash2, Plus, Clock, Target, DollarSign, AlertCircle } from 'lucide-react';
import { Client, Interaction, InteractionType, InteractionOutcome, ContactMethod } from '../../types';

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  onAddInteraction?: (clientId: string, interaction: Partial<Interaction>) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ 
  client, 
  onClose, 
  onEdit, 
  onDelete,
  onAddInteraction 
}) => {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: InteractionType.CALL,
    notes: '',
    outcome: InteractionOutcome.SUCCESSFUL,
    duration: 0,
    location: '',
    followUpDate: '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatContactMethod = (method: ContactMethod) => {
    switch (method) {
      case ContactMethod.IN_PERSON:
        return 'In Person';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
      case 'potential_buyer':
        return 'bg-blue-100 text-blue-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'tenant':
      case 'potential_tenant':
        return 'bg-purple-100 text-purple-800';
      case 'landlord':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.CALL:
        return <Phone size={16} />;
      case InteractionType.EMAIL:
        return <Mail size={16} />;
      case InteractionType.WHATSAPP:
        return <MessageCircle size={16} />;
      case InteractionType.APPOINTMENT:
      case InteractionType.PROPERTY_VIEWING:
      case InteractionType.CONTRACT_SIGNING:
        return <Calendar size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getOutcomeColor = (outcome: InteractionOutcome) => {
    switch (outcome) {
      case InteractionOutcome.SUCCESSFUL:
      case InteractionOutcome.CONVERTED:
        return 'text-green-600';
      case InteractionOutcome.INTERESTED:
        return 'text-blue-600';
      case InteractionOutcome.FOLLOW_UP_REQUIRED:
        return 'text-amber-600';
      case InteractionOutcome.NOT_INTERESTED:
      case InteractionOutcome.CANCELLED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleCallClient = () => {
    window.location.href = `tel:${client.phone}`;
  };

  const handleEmailClient = () => {
    const subject = encodeURIComponent(`Follow up - ${client.name}`);
    window.location.href = `mailto:${client.email}?subject=${subject}`;
  };

  const handleWhatsAppClient = () => {
    const message = encodeURIComponent(`Hi ${client.name}, this is regarding your property requirements.`);
    const phoneNumber = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleAddInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddInteraction) {
      const interaction: Partial<Interaction> = {
        ...newInteraction,
        date: new Date(),
        followUpDate: newInteraction.followUpDate ? new Date(newInteraction.followUpDate) : undefined,
      };
      onAddInteraction(client.id, interaction);
      setShowAddInteraction(false);
      setNewInteraction({
        type: InteractionType.CALL,
        notes: '',
        outcome: InteractionOutcome.SUCCESSFUL,
        duration: 0,
        location: '',
        followUpDate: '',
      });
    }
  };

  const sortedInteractions = [...client.interactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl">
              {getInitials(client.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(client.role)}`}>
                  {formatRole(client.role)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                  {formatStatus(client.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(client)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Client"
              >
                <Edit size={20} />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(client.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Client"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Primary Phone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                  
                  {client.secondaryPhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Secondary Phone</p>
                        <p className="font-medium">{client.secondaryPhone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                  
                  {client.address && (
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{client.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Details */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {client.budget && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">{client.budget.toLocaleString()} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Contact:</span>
                    <span className="font-medium">{formatContactMethod(client.preferredContactMethod)}</span>
                  </div>
                  {client.source && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium">{client.source}</span>
                    </div>
                  )}
                  {client.assignedAgent && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned Agent:</span>
                      <span className="font-medium">{client.assignedAgent}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(client.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{formatDate(client.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {client.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {client.notes && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{client.notes}</p>
                  </div>
                </div>
              )}

              {/* Client Needs */}
              {client.needs && (
                <div className="bg-amber-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <Target size={20} />
                    Client Requirements
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Property Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {client.needs.propertyType.map((type, index) => (
                          <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm capitalize">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Price Range:</p>
                        <p className="text-gray-600">{client.needs.minPrice.toLocaleString()} - {client.needs.maxPrice.toLocaleString()} MAD</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Surface Range:</p>
                        <p className="text-gray-600">{client.needs.minSurface} - {client.needs.maxSurface} m²</p>
                      </div>
                    </div>
                    
                    {client.needs.locations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Preferred Locations:</p>
                        <div className="flex flex-wrap gap-2">
                          {client.needs.locations.map((location, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {location}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {client.needs.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Required Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {client.needs.features.map((feature, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {client.needs.urgency && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Urgency:</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          client.needs.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                          client.needs.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          client.needs.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {client.needs.urgency.charAt(0).toUpperCase() + client.needs.urgency.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    {client.needs.timeline && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Timeline:</p>
                        <p className="text-gray-600">{client.needs.timeline}</p>
                      </div>
                    )}
                    
                    {client.needs.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Additional Notes:</p>
                        <p className="text-gray-600">{client.needs.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interaction History */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Interaction History</h3>
                  <button
                    onClick={() => setShowAddInteraction(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Interaction
                  </button>
                </div>
                
                {sortedInteractions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No interactions recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedInteractions.map((interaction) => (
                      <div key={interaction.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              {getInteractionIcon(interaction.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium capitalize">
                                  {interaction.type.replace('_', ' ')}
                                </h4>
                                {interaction.outcome && (
                                  <span className={`text-sm font-medium ${getOutcomeColor(interaction.outcome)}`}>
                                    • {interaction.outcome.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 mb-2">{interaction.notes}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{formatDate(interaction.date)}</span>
                                {interaction.duration && (
                                  <span>{interaction.duration} minutes</span>
                                )}
                                {interaction.location && (
                                  <span>📍 {interaction.location}</span>
                                )}
                              </div>
                              {interaction.followUpDate && (
                                <div className="mt-2 text-sm text-amber-600">
                                  Follow up: {formatDate(interaction.followUpDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleCallClient}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Call Now
                  </button>
                  <button
                    onClick={handleWhatsAppClient}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleEmailClient}
                    className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Send Email
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interactions:</span>
                    <span className="font-medium">{client.interactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Contact:</span>
                    <span className="font-medium">
                      {client.interactions.length > 0 
                        ? formatDate(sortedInteractions[0].date)
                        : 'Never'
                      }
                    </span>
                  </div>
                  {client.properties && client.properties.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Properties Owned:</span>
                      <span className="font-medium">{client.properties.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Interaction Modal */}
        {showAddInteraction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Interaction</h3>
                <button
                  onClick={() => setShowAddInteraction(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddInteractionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newInteraction.type}
                    onChange={(e) => setNewInteraction({...newInteraction, type: e.target.value as InteractionType})}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(InteractionType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction({...newInteraction, notes: e.target.value})}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={newInteraction.outcome}
                    onChange={(e) => setNewInteraction({...newInteraction, outcome: e.target.value as InteractionOutcome})}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(InteractionOutcome).map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {outcome.replace('_', ' ').charAt(0).toUpperCase() + outcome.replace('_', ' ').slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={newInteraction.duration}
                      onChange={(e) => setNewInteraction({...newInteraction, duration: Number(e.target.value)})}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up Date</label>
                    <input
                      type="date"
                      value={newInteraction.followUpDate}
                      onChange={(e) => setNewInteraction({...newInteraction, followUpDate: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newInteraction.location}
                    onChange={(e) => setNewInteraction({...newInteraction, location: e.target.value})}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddInteraction(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Interaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetails;