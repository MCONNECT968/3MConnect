import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowDownUp, Users, UserCheck, UserX, Building } from 'lucide-react';
import ClientCard from '../components/client/ClientCard';
import ClientForm from '../components/client/ClientForm';
import ClientDetails from '../components/client/ClientDetails';
import { Client, ClientRole, ClientStatus, ClientSortOption, Interaction } from '../types';
import { clients as mockClients } from '../data/mockData';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

const Clients: React.FC = () => {
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<ClientSortOption>(ClientSortOption.DATE_CREATED_DESC);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    tag: '',
    source: '',
    assignedAgent: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch clients from Firebase
  useEffect(() => {
    fetchClientsFromDatabase();
  }, []);

  // Function to fetch clients from database
  const fetchClientsFromDatabase = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching clients from Firebase...');
      const clientsData = await clientService.getClients();
      console.log('Received clients from Firebase:', clientsData);
      
      if (clientsData && clientsData.length > 0) {
        setClients(clientsData);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      // Keep using local storage data
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortOption = e.target.value as ClientSortOption;
    setSortBy(sortOption);
    applySorting(sortOption, clients);
  };

  const applySorting = (sortOption: ClientSortOption, clientsToSort: Client[]) => {
    const sorted = [...clientsToSort].sort((a, b) => {
      switch (sortOption) {
        case ClientSortOption.NAME_ASC:
          return a.name.localeCompare(b.name);
        case ClientSortOption.NAME_DESC:
          return b.name.localeCompare(a.name);
        case ClientSortOption.DATE_CREATED_ASC:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case ClientSortOption.DATE_CREATED_DESC:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case ClientSortOption.LAST_INTERACTION:
          const aLastInteraction = a.interactions.length > 0 
            ? Math.max(...a.interactions.map(i => new Date(i.date).getTime()))
            : 0;
          const bLastInteraction = b.interactions.length > 0 
            ? Math.max(...b.interactions.map(i => new Date(i.date).getTime()))
            : 0;
          return bLastInteraction - aLastInteraction;
        case ClientSortOption.ROLE:
          return a.role.localeCompare(b.role);
        case ClientSortOption.STATUS:
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    setClients(sorted);
  };

  const handleAddClient = async (clientData: Partial<Client>) => {
    try {
      console.log('Adding client with data:', clientData);
      
      setIsLoading(true);
      
      // Add client to Firebase
      const newClient = await clientService.addClient(clientData);
      console.log('Client created successfully:', newClient);
      
      // Update local state
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      applySorting(sortBy, updatedClients);
      setShowAddForm(false);
      success('Client Added', 'The client has been successfully added.');
      
      // Refresh clients from the database
      fetchClientsFromDatabase();
    } catch (err) {
      console.error('Error adding client:', err);
      error('Error', 'Failed to add client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = async (clientData: Partial<Client>) => {
    if (editingClient) {
      try {
        console.log('Editing client with data:', clientData);
        
        setIsLoading(true);
        
        // Update client in Firebase
        await clientService.updateClient(editingClient.id, clientData);
        
        const updatedClient: Client = {
          ...editingClient,
          ...clientData,
          updatedAt: new Date(),
        };

        const updatedClients = clients.map(c => 
          c.id === editingClient.id ? updatedClient : c
        );
        setClients(updatedClients);
        applySorting(sortBy, updatedClients);
        setEditingClient(null);
        setSelectedClient(updatedClient);
        success('Client Updated', 'The client has been successfully updated.');
        
        // Refresh clients from the database
        fetchClientsFromDatabase();
      } catch (err) {
        console.error('Error updating client:', err);
        error('Error', 'Failed to update client. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        console.log('Deleting client with ID:', clientId);
        
        setIsLoading(true);
        
        // Delete client from Firebase
        await clientService.deleteClient(clientId);
        console.log('Client deleted successfully');
        
        const updatedClients = clients.filter(c => c.id !== clientId);
        setClients(updatedClients);
        setSelectedClient(null);
        success('Client Deleted', 'The client has been successfully deleted.');
        
        // Refresh clients from the database
        fetchClientsFromDatabase();
      } catch (err) {
        console.error('Error deleting client:', err);
        error('Error', 'Failed to delete client. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddInteraction = async (clientId: string, interactionData: Partial<Interaction>) => {
    try {
      console.log('Adding interaction for client:', clientId, interactionData);
      
      setIsLoading(true);
      
      // Add interaction to Firebase
      const newInteraction = await clientService.addInteraction(clientId, interactionData);
      
      const updatedClients = clients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            interactions: [...client.interactions, newInteraction],
            updatedAt: new Date(),
          };
        }
        return client;
      });

      setClients(updatedClients);
      
      // Update selected client if it's the one being modified
      if (selectedClient && selectedClient.id === clientId) {
        const updatedSelectedClient = updatedClients.find(c => c.id === clientId);
        if (updatedSelectedClient) {
          setSelectedClient(updatedSelectedClient);
        }
      }

      success('Interaction Added', 'The interaction has been successfully added.');
      
      // Refresh clients from the database
      fetchClientsFromDatabase();
    } catch (err) {
      console.error('Error adding interaction:', err);
      error('Error', 'Failed to add interaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredClients = [...clients];

    if (searchTerm) {
      filteredClients = filteredClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.role) {
      filteredClients = filteredClients.filter(
        (client) => client.role === filters.role
      );
    }

    if (filters.status) {
      filteredClients = filteredClients.filter(
        (client) => client.status === filters.status
      );
    }

    if (filters.tag) {
      filteredClients = filteredClients.filter(
        (client) => client.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase()))
      );
    }

    if (filters.source) {
      filteredClients = filteredClients.filter(
        (client) => client.source && client.source.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    if (filters.assignedAgent) {
      filteredClients = filteredClients.filter(
        (client) => client.assignedAgent && client.assignedAgent.toLowerCase().includes(filters.assignedAgent.toLowerCase())
      );
    }

    applySorting(sortBy, filteredClients);
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      status: '',
      tag: '',
      source: '',
      assignedAgent: '',
    });
    setSearchTerm('');
    applySorting(sortBy, clients);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
  };

  const getSortLabel = (option: ClientSortOption) => {
    switch (option) {
      case ClientSortOption.NAME_ASC:
        return 'Name (A-Z)';
      case ClientSortOption.NAME_DESC:
        return 'Name (Z-A)';
      case ClientSortOption.DATE_CREATED_ASC:
        return 'Date Created (Oldest)';
      case ClientSortOption.DATE_CREATED_DESC:
        return 'Date Created (Newest)';
      case ClientSortOption.LAST_INTERACTION:
        return 'Last Interaction';
      case ClientSortOption.ROLE:
        return 'Role';
      case ClientSortOption.STATUS:
        return 'Status';
      default:
        return option;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  // Get all unique values for filter dropdowns
  const allTags = Array.from(
    new Set(clients.flatMap((client) => client.tags))
  );
  const allSources = Array.from(
    new Set(clients.map((client) => client.source).filter(Boolean))
  );
  const allAgents = Array.from(
    new Set(clients.map((client) => client.assignedAgent).filter(Boolean))
  );

  // Get client statistics
  const getClientStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.status === ClientStatus.ACTIVE).length;
    const prospects = clients.filter(c => c.status === ClientStatus.PROSPECT).length;
    const converted = clients.filter(c => c.status === ClientStatus.CONVERTED).length;
    const owners = clients.filter(c => c.role === ClientRole.OWNER).length;

    return { total, active, prospects, converted, owners };
  };

  const stats = getClientStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients Database</h1>
          <p className="text-gray-600 mt-1">{stats.total} total clients</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Clients</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.active}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Prospects</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.prospects}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Converted</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.converted}</p>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building size={20} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-900">Owners</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">{stats.owners}</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or address..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                showFilters || getActiveFiltersCount() > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filters</span>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md">
              <ArrowDownUp size={18} />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border-none outline-none bg-transparent text-sm"
              >
                {Object.values(ClientSortOption).map((option) => (
                  <option key={option} value={option}>
                    {getSortLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {Object.values(ClientRole).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {Object.values(ClientStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag
                </label>
                <select
                  name="tag"
                  value={filters.tag}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={filters.source}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  {allSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Agent
                </label>
                <select
                  name="assignedAgent"
                  value={filters.assignedAgent}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Agents</option>
                  {allAgents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleClientClick(client)}
            />
          ))}
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={(client) => {
            setEditingClient(client);
            setSelectedClient(null);
          }}
          onDelete={handleDeleteClient}
          onAddInteraction={handleAddInteraction}
        />
      )}

      {/* Add Client Form */}
      {showAddForm && (
        <ClientForm
          onSubmit={handleAddClient}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Client Form */}
      {editingClient && (
        <ClientForm
          initialData={editingClient}
          onSubmit={handleEditClient}
          onClose={() => setEditingClient(null)}
        />
      )}
    </div>
  );
};

export default Clients;