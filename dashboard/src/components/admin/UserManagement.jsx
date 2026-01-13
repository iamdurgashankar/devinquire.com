import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/EnhancedAuthContext';
import userService from '../../services/userService';
import { motion } from 'framer-motion';

export default function UserManagement() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [realTimeListenerId, setRealTimeListenerId] = useState(null);

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
    setupRealTimeListeners();
    
    return () => {
      if (realTimeListenerId) {
        userService.stopListening?.(realTimeListenerId);
      }
    };
  }, []);

  const setupRealTimeListeners = () => {
    if (userService.listenToUsers) {
      const listenerId = userService.listenToUsers((result) => {
        if (result.success) {
          setUsers(result.data);
          // Update pending users
          const pending = result.data.filter(user => user.status === 'pending');
          setPendingUsers(pending);
        }
      });
      setRealTimeListenerId(listenerId);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    try {
      const result = await userService.getPendingUsers();
      if (result.success) {
        setPendingUsers(result.data);
      }
    } catch (err) {
      console.error('Failed to load pending users:', err);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const result = await userService.approveUser(userId);
      if (result.success) {
        loadUsers();
        loadPendingUsers();
        showNotification('User approved successfully', 'success');
      } else {
        showNotification('Failed to approve user', 'error');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const result = await userService.rejectUser(userId);
      if (result.success) {
        loadUsers();
        loadPendingUsers();
        showNotification('User rejected successfully', 'success');
      } else {
        showNotification('Failed to reject user', 'error');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const result = await userService.updateUserRole(userId, newRole);
      if (result.success) {
        loadUsers();
        showNotification('User role updated successfully', 'success');
      } else {
        showNotification('Failed to update user role', 'error');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const result = await userService.suspendUser(userId);
      if (result.success) {
        loadUsers();
        showNotification('User suspended successfully', 'success');
      } else {
        showNotification('Failed to suspend user', 'error');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const result = await userService.banUser(userId);
      if (result.success) {
        loadUsers();
        showNotification('User banned successfully', 'success');
      } else {
        showNotification('Failed to ban user', 'error');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleBulkAction = async (action) => {
    const userIds = Array.from(selectedUsers);
    if (userIds.length === 0) {
      showNotification('Please select users first', 'warning');
      return;
    }

    try {
      const promises = userIds.map(userId => {
        switch (action) {
          case 'approve':
            return userService.approveUser(userId);
          case 'suspend':
            return userService.suspendUser(userId);
          case 'delete':
            return userService.deleteUser(userId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      loadUsers();
      setSelectedUsers(new Set());
      showNotification(`Bulk ${action} completed successfully`, 'success');
    } catch (err) {
      showNotification(`Bulk ${action} failed`, 'error');
    }
  };

  const showNotification = (message, type) => {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserSelect = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.uid)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-neutral-400 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        
        {pendingUsers.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-yellow-500/20 border border-yellow-400/30 text-yellow-200 px-4 py-2 rounded-lg"
          >
            {pendingUsers.length} user(s) pending approval
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Users', count: users.length },
            { id: 'pending', label: 'Pending Approval', count: pendingUsers.length },
            { id: 'active', label: 'Active Users', count: users.filter(u => u.status === 'active').length },
            { id: 'suspended', label: 'Suspended', count: users.filter(u => u.status === 'suspended').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-neutral-700 text-neutral-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-neutral-400"
            />
            <svg className="absolute right-3 top-2.5 h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Approve ({selectedUsers.size})
            </button>
            <button
              onClick={() => handleBulkAction('suspend')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Suspend ({selectedUsers.size})
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete ({selectedUsers.size})
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-700">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-neutral-700 border-neutral-600 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-neutral-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.uid)}
                      onChange={() => handleUserSelect(user.uid)}
                      className="rounded bg-neutral-700 border-neutral-600 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={userService.getUserAvatar(user)}
                        alt={user.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-neutral-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)}
                      disabled={user.uid === currentUser?.uid}
                      className="text-sm bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                    {user.metadata?.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                    {user.metadata?.lastLoginAt?.toDate?.()?.toLocaleDateString() || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveUser(user.uid)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.uid)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {user.status === 'active' && user.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleSuspendUser(user.uid)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View
                      </button>
                      
                      {user.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleBanUser(user.uid)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-300">No users found</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUpdate={loadUsers}
        />
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

// User Details Modal Component
function UserDetailsModal({ user, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [userActivity, setUserActivity] = useState([]);

  useEffect(() => {
    loadUserActivity();
  }, [user.uid]);

  const loadUserActivity = async () => {
    try {
      setLoading(true);
      const result = await userService.getUserActivityLog(user.uid);
      if (result.success) {
        setUserActivity(result.data);
      }
    } catch (err) {
      console.error('Failed to load user activity:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={userService.getUserAvatar(user)}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-medium text-white">{user.name}</h3>
                  <p className="text-neutral-400">{user.email}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-neutral-400">Role:</span>
                  <span className="ml-2 text-white">{user.role}</span>
                </div>
                <div>
                  <span className="text-sm text-neutral-400">Provider:</span>
                  <span className="ml-2 text-white">{user.provider}</span>
                </div>
                <div>
                  <span className="text-sm text-neutral-400">Verified:</span>
                  <span className="ml-2 text-white">{user.verified ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-sm text-neutral-400">Joined:</span>
                  <span className="ml-2 text-white">
                    {user.metadata?.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-400">Last Login:</span>
                  <span className="ml-2 text-white">
                    {user.metadata?.lastLoginAt?.toDate?.()?.toLocaleDateString() || 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-neutral-400">Login Count:</span>
                  <span className="ml-2 text-white">{user.metadata?.loginCount || 0}</span>
                </div>
              </div>
            </div>

            {/* User Activity */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Recent Activity</h4>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userActivity.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userActivity.map((activity, index) => (
                    <div key={index} className="p-3 bg-neutral-700 rounded-lg">
                      <div className="text-sm text-white">{activity.action}</div>
                      <div className="text-xs text-neutral-400">
                        {activity.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">No activity recorded</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}