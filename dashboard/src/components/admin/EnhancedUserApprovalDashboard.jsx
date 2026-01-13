import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useEnhancedAuth } from '../../middleware/EnhancedAuthMiddleware';

const EnhancedUserApprovalDashboard = () => {
  const { userProfile, hasAnyRole } = useEnhancedAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState(new Set());
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    banned: 0,
    total: 0
  });

  // Check if user has admin permissions
  const isAdmin = hasAnyRole(['admin']);

  useEffect(() => {
    if (!isAdmin) return;

    // Load user statistics
    loadUserStats();

    // Set up real-time listener for users
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin]);

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const newStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        suspended: 0,
        banned: 0,
        total: snapshot.size
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        if (newStats.hasOwnProperty(status)) {
          newStats[status]++;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Filter users based on current filter and search term
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Handle user approval
  const handleApproveUser = async (userId) => {
    try {
      setProcessingUsers(prev => new Set([...prev, userId]));
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: userProfile.uid,
        updatedAt: new Date().toISOString()
      });

      // Send approval email
      const user = users.find(u => u.id === userId);
      if (user) {
        const sendEmail = httpsCallable(functions, 'sendEmail');
        await sendEmail({
          template: 'account_approved',
          to: user.email,
          data: {
            displayName: user.displayName || user.email,
            approvalDate: new Date().toLocaleDateString()
          }
        });
      }

      // Refresh stats
      loadUserStats();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user: ' + error.message);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle user rejection
  const handleRejectUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setUserToReject(user);
    setShowRejectionModal(true);
  };

  // Confirm user rejection
  const confirmRejectUser = async () => {
    if (!userToReject || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setProcessingUsers(prev => new Set([...prev, userToReject.id]));
      
      const userRef = doc(db, 'users', userToReject.id);
      await updateDoc(userRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: userProfile.uid,
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date().toISOString()
      });

      // Send rejection email
      const sendEmail = httpsCallable(functions, 'sendEmail');
      await sendEmail({
        template: 'account_rejected',
        to: userToReject.email,
        data: {
          displayName: userToReject.displayName || userToReject.email,
          rejectionReason: rejectionReason.trim(),
          rejectionDate: new Date().toLocaleDateString()
        }
      });

      // Reset modal state
      setShowRejectionModal(false);
      setUserToReject(null);
      setRejectionReason('');
      
      // Refresh stats
      loadUserStats();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user: ' + error.message);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userToReject.id);
        return newSet;
      });
    }
  };

  // Handle user suspension
  const handleSuspendUser = async (userId) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      setProcessingUsers(prev => new Set([...prev, userId]));
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: new Date().toISOString(),
        suspendedBy: userProfile.uid,
        updatedAt: new Date().toISOString()
      });

      loadUserStats();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user: ' + error.message);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle user ban
  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure you want to ban this user? This action is permanent.')) return;

    try {
      setProcessingUsers(prev => new Set([...prev, userId]));
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'banned',
        bannedAt: new Date().toISOString(),
        bannedBy: userProfile.uid,
        updatedAt: new Date().toISOString()
      });

      loadUserStats();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user: ' + error.message);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedUsers.size} selected users?`)) return;

    try {
      const promises = Array.from(selectedUsers).map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const updateData = {
          updatedAt: new Date().toISOString()
        };

        switch (bulkAction) {
          case 'approve':
            updateData.status = 'approved';
            updateData.approvedAt = new Date().toISOString();
            updateData.approvedBy = userProfile.uid;
            break;
          case 'suspend':
            updateData.status = 'suspended';
            updateData.suspendedAt = new Date().toISOString();
            updateData.suspendedBy = userProfile.uid;
            break;
          case 'ban':
            updateData.status = 'banned';
            updateData.bannedAt = new Date().toISOString();
            updateData.bannedBy = userProfile.uid;
            break;
          default:
            return;
        }

        await updateDoc(userRef, updateData);
      });

      await Promise.all(promises);
      setSelectedUsers(new Set());
      setBulkAction('');
      loadUserStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action: ' + error.message);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Select all filtered users
  const selectAllUsers = () => {
    setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'banned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the user approval dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Approval Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage user registrations and account approvals</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.pending}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.approved}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.rejected}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.suspended}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Suspended</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.suspended}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.banned}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Banned</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.banned}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stats.total}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>

                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedUsers.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedUsers.size} selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="approve">Approve</option>
                    <option value="suspend">Suspend</option>
                    <option value="ban">Ban</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearSelection}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Users ({filteredUsers.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllUsers}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectedUsers.size === filteredUsers.length ? clearSelection : selectAllUsers}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={selectedUsers.has(user.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoURL ? (
                            <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {(user.displayName || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              disabled={processingUsers.has(user.id)}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {processingUsers.has(user.id) ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              disabled={processingUsers.has(user.id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              disabled={processingUsers.has(user.id)}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleBanUser(user.id)}
                              disabled={processingUsers.has(user.id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {(user.status === 'suspended' || user.status === 'rejected') && (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            disabled={processingUsers.has(user.id)}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingUsers.has(user.id) ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">No users match your current filter criteria.</p>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Reject User: {userToReject?.displayName || userToReject?.email}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejecting this user's registration..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setUserToReject(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejectUser}
                    disabled={!rejectionReason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedUserApprovalDashboard;