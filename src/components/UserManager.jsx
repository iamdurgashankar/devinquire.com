import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function UserManager() {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Access denied. Admins only.
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('UserManager: Loading users...');
      const usersResponse = await apiService.getAllUsers();
      console.log('UserManager: Users response:', usersResponse);
      if (usersResponse.success) {
        setPendingUsers(usersResponse.pendingUsers || []);
        setAllUsers(usersResponse.allUsers || []);
        console.log('All users:', usersResponse.allUsers);
        console.log('Pending users:', usersResponse.pendingUsers);
      } else {
        console.error('UserManager: Users fetch failed:', usersResponse);
        setPendingUsers([]);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('UserManager: Error loading users:', error);
      setMessage('Error loading users: ' + error.message);
      setPendingUsers([]);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await apiService.approveUser(userId);
      if (response.success) {
        setMessage(response.message);
        loadUsers(); // Reload users
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('Error approving user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await apiService.rejectUser(userId);
      if (response.success) {
        setMessage(response.message);
        loadUsers(); // Reload users
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('Error rejecting user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) {
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        setMessage(response.message);
        loadUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('Error removing user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', text: 'Admin' },
      user: { color: 'bg-blue-100 text-blue-800', text: 'User' },
      author: { color: 'bg-orange-100 text-orange-800', text: 'Author' },
    };

    const config = roleConfig[role] || roleConfig.user;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user registrations and approvals</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Users ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Users ({allUsers.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {activeTab === 'pending' ? (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve new user registrations
                </p>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending users</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All user registrations have been processed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View all registered users in the system
                </p>
              </div>

              <div className="overflow-x-auto">
                {allUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-600">No users are registered in the system.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.id === currentUser.id ? (
                              getRoleBadge(user.role)
                            ) : (
                              <select
                                value={user.role}
                                onChange={async (e) => {
                                  const newRole = e.target.value;
                                  setLoading(true);
                                  setMessage("");
                                  try {
                                    const response = await apiService.updateUserRole(user.id, newRole);
                                    if (response.success) {
                                      setMessage(response.message);
                                      loadUsers();
                                      setTimeout(() => setMessage(''), 3000);
                                    } else {
                                      setMessage(response.message);
                                    }
                                  } catch (error) {
                                    setMessage('Error updating role: ' + error.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-2 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                              >
                                <option value="user">User</option>
                                <option value="author">Author</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 