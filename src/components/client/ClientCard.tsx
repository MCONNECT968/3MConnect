import React from 'react';
import { Phone, Mail, Tag, Clock, MapPin, DollarSign, AlertCircle, User } from 'lucide-react';
import { Client, ClientStatus, ClientRole } from '../../types';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
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
    }).format(date);
  };

  const getLastInteraction = () => {
    if (client.interactions.length === 0) {
      return 'No interactions yet';
    }
    
    const lastInteraction = [...client.interactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )[0];
    
    return `${lastInteraction.type.replace('_', ' ')} on ${formatDate(lastInteraction.date)}`;
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case ClientStatus.PROSPECT:
        return 'bg-blue-100 text-blue-800';
      case ClientStatus.CONVERTED:
        return 'bg-purple-100 text-purple-800';
      case ClientStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case ClientStatus.ARCHIVED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: ClientRole) => {
    switch (role) {
      case ClientRole.BUYER:
        return 'bg-blue-100 text-blue-800';
      case ClientRole.TENANT:
        return 'bg-purple-100 text-purple-800';
      case ClientRole.OWNER:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: ClientRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatStatus = (status: ClientStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getUrgencyIndicator = () => {
    if (client.needs?.urgency === 'urgent') {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle size={14} />
          <span className="text-xs font-medium">URGENT</span>
        </div>
      );
    }
    if (client.needs?.urgency === 'high') {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <AlertCircle size={14} />
          <span className="text-xs font-medium">HIGH</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-800 dark:text-blue-200 font-bold flex-shrink-0">
            {getInitials(client.name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{client.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(client.role)}`}>
                {formatRole(client.role)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                {formatStatus(client.status)}
              </span>
            </div>
          </div>
        </div>
        
        {getUrgencyIndicator()}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Phone size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{client.phone}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Mail size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
        
        {client.address && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={16} className="mr-2 flex-shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}

        {client.budget && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <DollarSign size={16} className="mr-2 flex-shrink-0" />
            <span>{client.budget.toLocaleString()} MAD</span>
          </div>
        )}
        
        {client.tags.length > 0 && (
          <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
            <Tag size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1 min-w-0">
              {client.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs truncate dark:text-gray-300">
                  {tag}
                </span>
              ))}
              {client.tags.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">+{client.tags.length - 2} more</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Clock size={16} className="mr-2 flex-shrink-0" />
          <span className="truncate">{getLastInteraction()}</span>
        </div>

        {client.assignedAgent && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <User size={16} className="mr-2 flex-shrink-0" />
            <span className="truncate">{client.assignedAgent}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {client.interactions.length} interaction{client.interactions.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex gap-2">
          <button 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;