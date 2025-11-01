import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../services/api/users';
import { 
  Users, 
  Search, 
  Filter, 
  Mail,
  Calendar,
  Shield,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Loader,
  X,
  Save,
  User,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: null,
    formData: {},
    loading: false
  });

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await usersAPI.getUsers(params);
      
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEditUser = (user) => {
    setEditModal({
      isOpen: true,
      user: user,
      formData: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'reader',
        institution: user.institution || '',
        bio: user.bio || '',
        specialization: user.specialization ? user.specialization.join(', ') : '',
        status: user.status || 'pending'
      },
      loading: false
    });
  };

  const handleCloseEditModal = () => {
    setEditModal({
      isOpen: false,
      user: null,
      formData: {},
      loading: false
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  };

  const handleSaveUser = async () => {
    try {
      setEditModal(prev => ({ ...prev, loading: true }));
      
      const updateData = {
        firstName: editModal.formData.firstName.trim(),
        lastName: editModal.formData.lastName.trim(),
        email: editModal.formData.email.trim(),
        role: editModal.formData.role,
        status: editModal.formData.status,
        institution: editModal.formData.institution.trim(),
        bio: editModal.formData.bio.trim(),
        specialization: editModal.formData.specialization
          ? editModal.formData.specialization.split(',').map(s => s.trim()).filter(s => s)
          : []
      };

      const response = await usersAPI.updateUser(editModal.user._id, updateData);
      
      if (response.success) {
        toast.success('User updated successfully');
        handleCloseEditModal();
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setUpdating(userId);
        await usersAPI.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      setUpdating(userId);
      
      const updateData = { status: newStatus };
      
      const response = await usersAPI.updateUser(userId, updateData);
      
      if (response.success) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${newStatus === 'active' ? 'activate' : 'suspend'} user`);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setUpdating(userId);
      
      const updateData = { role: newRole };
      
      const response = await usersAPI.updateUser(userId, updateData);
      
      if (response.success) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to update user role');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status, userId) => {
    const iconConfig = {
      active: {
        icon: UserCheck,
        color: 'text-green-600 hover:text-green-800',
        title: 'Active - Click to suspend',
        hoverColor: 'hover:bg-green-50'
      },
      suspended: {
        icon: UserX,
        color: 'text-red-600 hover:text-red-800',
        title: 'Suspended - Click to activate',
        hoverColor: 'hover:bg-red-50'
      },
      pending: {
        icon: Clock,
        color: 'text-yellow-600 hover:text-yellow-800',
        title: 'Pending - Click to activate',
        hoverColor: 'hover:bg-yellow-50'
      }
    };

    const config = iconConfig[status] || iconConfig.pending;
    const IconComponent = config.icon;

    return (
      <button
        onClick={() => handleToggleStatus(userId, status)}
        disabled={updating === userId}
        className={`p-2 rounded-lg transition-all duration-200 ${config.color} ${config.hoverColor} disabled:opacity-50`}
        title={config.title}
      >
        {updating === userId ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <IconComponent className="h-4 w-4" />
        )}
      </button>
    );
  };

  const getRoleBadge = (user) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      researcher: { color: 'bg-blue-100 text-blue-800', label: 'Researcher' },
      reader: { color: 'bg-gray-100 text-gray-800', label: 'Reader' }
    };
    const config = roleConfig[user.role] || roleConfig.reader;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
          {config.label}
        </span>
        <select
          value={user.role}
          onChange={(e) => handleUpdateRole(user._id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary-500"
          disabled={updating === user._id}
        >
          <option value="reader">Reader</option>
          <option value="researcher">Researcher</option>
          <option value="admin">Admin</option>
        </select>
        {updating === user._id && (
          <Loader className="h-3 w-3 animate-spin text-gray-500" />
        )}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalUsers = pagination.total;
  const researchersCount = users.filter(u => u.role === 'researcher').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="w-full lg:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="researcher">Researcher</option>
                  <option value="reader">Reader</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={`${user.firstName} ${user.lastName}`}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-primary-600 font-semibold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive ? formatDate(user.lastActive) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(user.status, user._id)}
                        
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={updating === user._id}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Delete User"
                        >
                          {updating === user._id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No users in the system'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {users.length} of {pagination.total} users
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{researchersCount}</div>
            <div className="text-sm text-gray-600">Researchers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{suspendedCount}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Edit User: {editModal.user?.firstName} {editModal.user?.lastName}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editModal.formData.firstName}
                    onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editModal.formData.lastName}
                    onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editModal.formData.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editModal.formData.role}
                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="reader">Reader</option>
                    <option value="researcher">Researcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={editModal.formData.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={editModal.formData.institution}
                  onChange={(e) => handleEditFormChange('institution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization (comma separated)
                </label>
                <input
                  type="text"
                  value={editModal.formData.specialization}
                  onChange={(e) => handleEditFormChange('specialization', e.target.value)}
                  placeholder="e.g., Bacteriology, Virology, Immunology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editModal.formData.bio}
                  onChange={(e) => handleEditFormChange('bio', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength="500"
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {editModal.formData.bio?.length || 0}/500 characters
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={editModal.loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={editModal.loading}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {editModal.loading ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editModal.loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;