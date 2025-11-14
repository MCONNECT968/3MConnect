import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowDownUp, 
  Users as UsersIcon, 
  User, 
  Shield, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Lock, 
  Key, 
  UserPlus, 
  UserX, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { User as UserType, UserRole, UserSortOption } from '../types';
import { mockUsers } from '../data/mockData';
import api from '../config/api';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useLocalStorage<UserType[]>(STORAGE_KEYS.USERS, mockUsers);
  const { success, error, info } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [sortBy, setSortBy] = useState<UserSortOption>(UserSortOption.DATE_CREATED_DESC);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: UserRole.AGENT,
    password: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersData = await userService.getUsers();
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // Keep using local storage data but ensure isActive is set
        const updatedUsers = users.map(user => ({
          ...user,
          isActive: user.isActive !== undefined ? user.isActive : true
        }));
        setUsers(updatedUsers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortOption = e.target.value as UserSortOption;
    setSortBy(sortOption);
    applySorting(sortOption, users);
  };

  const applySorting = (sortOption: UserSortOption, usersToSort: UserType[]) => {
    const sorted = [...usersToSort].sort((a, b) => {
      switch (sortOption) {
        case UserSortOption.NAME_ASC:
          return a.name.localeCompare(b.name);
        case UserSortOption.NAME_DESC:
          return b.name.localeCompare(a.name);
        case UserSortOption.DATE_CREATED_ASC:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case UserSortOption.DATE_CREATED_DESC:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case UserSortOption.LAST_LOGIN:
          const aLastLogin = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const bLastLogin = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          return bLastLogin - aLastLogin;
        case UserSortOption.ROLE:
          return a.role.localeCompare(b.role);
        default:
          return 0;
      }
    });
    setUsers(sorted);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newUser.password !== newUser.confirmPassword) {
      error('Password Error', 'Passwords do not match');
      return;
    }

    if (newUser.password.length < 6) {
      error('Password Error', 'Password must be at least 6 characters long');
      return;
    }
    
    // Check if email already exists
    if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      error('Email Error', 'A user with this email already exists');
      return;
    }

    try {
      setIsLoading(true);
      
      // Register user with Firebase Auth and add to Firestore
      const user = await authService.register(newUser.email, newUser.password, newUser.name);

      const updatedUsers = [user, ...users];
      setUsers(updatedUsers);
      applySorting(sortBy, updatedUsers);
      setShowAddForm(false);
      
      // Reset form
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: UserRole.AGENT,
        password: '',
        confirmPassword: '',
      });
      
      success('User Added', `${user.name} has been added successfully`);
    } catch (err) {
      console.error('Error adding user:', err);
      error('Error', 'Failed to add user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: UserType) => {
    // Check if email already exists (except for this user)
    if (users.some(user => 
      user.id !== updatedUser.id && 
      user.email.toLowerCase() === updatedUser.email.toLowerCase()
    )) {
      error('Email Error', 'A user with this email already exists');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update user in Firebase
      await userService.updateUser(updatedUser.id, updatedUser);

      const updatedUsers = users.map(user => 
        user.id === updatedUser.id ? { ...updatedUser, updatedAt: new Date() } : user
      );
      setUsers(updatedUsers);
      applySorting(sortBy, updatedUsers);
      setEditingUser(null);
      setSelectedUser(updatedUser);
      
      success('User Updated', `${updatedUser.name}'s information has been updated`);
    } catch (err) {
      console.error('Error updating user:', err);
      error('Error', 'Failed to update user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Don't allow deleting yourself
    if (currentUser && userId === currentUser.id) {
      error('Delete Error', 'You cannot delete your own account');
      return;
    }
    
    // Don't allow deleting the last admin
    const isAdmin = users.find(user => user.id === userId)?.role === UserRole.ADMIN;
    const adminCount = users.filter(user => user.role === UserRole.ADMIN).length;
    
    if (isAdmin && adminCount <= 1) {
      error('Delete Error', 'Cannot delete the last admin account');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const userToDelete = users.find(user => user.id === userId);
        
        setIsLoading(true);
        
        // Delete user from Firebase
        await userService.deleteUser(userId);

        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);
        setSelectedUser(null);
        setEditingUser(null);
        
        success('User Deleted', `${userToDelete?.name} has been deleted successfully`);
      } catch (err) {
        console.error('Error deleting user:', err);
        error('Error', 'Failed to delete user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    // Don't allow deactivating yourself
    if (currentUser && userId === currentUser.id) {
      error('Status Error', 'You cannot deactivate your own account');
      return;
    }
    
    // Don't allow deactivating the last active admin
    const user = users.find(user => user.id === userId);
    const isAdmin = user?.role === UserRole.ADMIN;
    const activeAdminCount = users.filter(user => 
      user.role === UserRole.ADMIN && user.isActive
    ).length;
    
    if (isAdmin && activeAdminCount <= 1 && user?.isActive) {
      error('Status Error', 'Cannot deactivate the last active admin account');
      return;
    }
    
    try {
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          const newStatus = !user.isActive;
          
          // Update user status in Firebase
          userService.updateUser(userId, { ...user, isActive: newStatus });
          
          // If we're viewing or editing this user, update the selected/editing user too
          if (selectedUser?.id === userId) {
            setSelectedUser({ ...selectedUser, isActive: newStatus });
          }
          if (editingUser?.id === userId) {
            setEditingUser({ ...editingUser, isActive: newStatus });
          }
          
          success(
            newStatus ? 'User Activated' : 'User Deactivated', 
            `${user.name} has been ${newStatus ? 'activated' : 'deactivated'} successfully`
          );
          
          return { ...user, isActive: newStatus, updatedAt: new Date() };
        }
        return user;
      });
      
      setUsers(updatedUsers);
    } catch (err) {
      console.error('Error toggling user status:', err);
      error('Error', 'Failed to update user status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find(user => user.id === userId);
    if (user) {
      try {
        setIsLoading(true);
        
        // Reset password with Firebase Auth
        await authService.resetPassword(user.email);
        
        info('Password Reset', `A password reset link has been sent to ${user.email}`);
      } catch (err) {
        console.error('Error resetting password:', err);
        error('Error', 'Failed to reset password. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applyFilters = () => {
    let filteredUsers = [...users];

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone && user.phone.includes(searchTerm))
      );
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role
      );
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      filteredUsers = filteredUsers.filter(
        (user) => user.isActive === isActive
      );
    }

    applySorting(sortBy, filteredUsers);
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      status: '',
    });
    setSearchTerm('');
    applySorting(sortBy, users);
  };

  const getSortLabel = (option: UserSortOption) => {
    switch (option) {
      case UserSortOption.NAME_ASC:
        return 'Name (A-Z)';
      case UserSortOption.NAME_DESC:
        return 'Name (Z-A)';
      case UserSortOption.DATE_CREATED_ASC:
        return 'Date Created (Oldest)';
      case UserSortOption.DATE_CREATED_DESC:
        return 'Date Created (Newest)';
      case UserSortOption.LAST_LOGIN:
        return 'Last Login';
      case UserSortOption.ROLE:
        return 'Role';
      default:
        return option;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.AGENT:
        return 'bg-blue-100 text-blue-800';
      case UserRole.ASSISTANT:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Get user statistics
  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = users.filter(u => !u.isActive).length;
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const agents = users.filter(u => u.role === UserRole.AGENT).length;
    const assistants = users.filter(u => u.role === UserRole.ASSISTANT).length;

    return { total, active, inactive, admins, agents, assistants };
  };

  const stats = getUserStats();

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={18} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-amber-500 mr-2" />
            <p className="text-amber-700">Only administrators can add, edit, or delete users.</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Users</span>
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
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Inactive</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Admins</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User size={20} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Agents</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{stats.agents}</p>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User size={20} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-900">Assistants</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">{stats.assistants}</p>
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
              placeholder="Search by name, email, or phone..."
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
                {Object.values(UserSortOption).map((option) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-semibold text-sm">
                    {getInitials(user.name)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.isActive)}
                    {currentUser && user.id === currentUser.id && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        You
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Last login: {formatDate(user.lastLogin)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Created: {formatDate(user.createdAt)}</span>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit User"
                    disabled={!isAdmin}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(user.id)}
                    className={`p-2 ${
                      user.isActive 
                        ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    } rounded-full transition-colors`}
                    title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    disabled={!isAdmin || (currentUser && user.id === currentUser.id)}
                  >
                    {user.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                    title="Reset Password"
                    disabled={!isAdmin}
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete User"
                    disabled={!isAdmin || (currentUser && user.id === currentUser.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingUser) {
                handleUpdateUser(editingUser);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.values(UserRole).map((role) => (
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
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editingUser.isActive}
                      onChange={() => setEditingUser({...editingUser, isActive: true})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={currentUser && editingUser.id === currentUser.id}
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!editingUser.isActive}
                      onChange={() => setEditingUser({...editingUser, isActive: false})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={currentUser && editingUser.id === currentUser.id}
                    />
                    <span>Inactive</span>
                  </label>
                </div>
                {currentUser && editingUser.id === currentUser.id && (
                  <p className="text-xs text-amber-600 mt-1">
                    You cannot change your own status
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-semibold text-3xl">
                    {getInitials(selectedUser.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.isActive)}
                    {currentUser && selectedUser.id === currentUser.id && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        You
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    {selectedUser.phone && (
                      <div className="flex items-center gap-3">
                        <Phone size={18} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{selectedUser.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Account Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium">{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium">{formatDate(selectedUser.lastLogin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(selectedUser.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() => handleResetPassword(selectedUser.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-amber-500 text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                  >
                    <Key size={16} />
                    <span>Reset Password</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingUser(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit User</span>
                  </button>
                  
                  {!(currentUser && selectedUser.id === currentUser.id) && (
                    <button
                      onClick={() => handleToggleUserStatus(selectedUser.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        selectedUser.isActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {selectedUser.isActive ? (
                        <>
                          <XCircle size={16} />
                          <span>Deactivate User</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          <span>Activate User</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;