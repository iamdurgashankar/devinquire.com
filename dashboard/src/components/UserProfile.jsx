import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit, 
  Save, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  Bell,
  X,
  Activity,
  Settings 
} from 'lucide-react';

function StatusBadge({ status }) {
  let color = 'bg-gray-200 text-gray-700';
  let text = status;
  if (status === 'approved') {
    color = 'bg-green-100 text-green-800';
    text = 'Approved';
  } else if (status === 'pending') {
    color = 'bg-yellow-100 text-yellow-800';
    text = 'Pending Approval';
  } else if (status === 'rejected') {
    color = 'bg-red-100 text-red-800';
    text = 'Rejected';
  }
  return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{text}</span>;
}

export default function UserProfile() {
  const { currentUser, changePassword, updateCurrentUser } = useAuth();
  const { setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({ theme: 'system', notifications: true });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState('');

  // Initialize profile data from currentUser or default values
  const [profileData, setProfileData] = useState(() => {
    return {
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      bio: '',
      website: '',
      location: '',
      twitter: '',
      github: ''
    };
  });

  const [profileStatus, setProfileStatus] = useState(currentUser?.status || 'approved');
  const [statusTooltip, setStatusTooltip] = useState(false);
  const [memberSince, setMemberSince] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Load full profile data from Firestore when component mounts or user changes
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser?.id && !currentUser?.uid) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const apiService = (await import('../services/api')).default;
        const userId = currentUser.id || currentUser.uid;
        
        // Get full user profile from Firestore
        const userResult = await apiService.getCurrentUser();
        
        if (userResult && userResult.success && userResult.data) {
          const userData = userResult.data;
          
          // Update profile data with loaded values
          setProfileData(prev => ({
            displayName: userData.displayName || userData.name || currentUser?.displayName || prev.displayName,
            email: userData.email || currentUser?.email || prev.email,
            bio: userData.bio || prev.bio || '',
            website: userData.website || prev.website || '',
            location: userData.location || prev.location || '',
            twitter: userData.twitter || prev.twitter || '',
            github: userData.github || prev.github || ''
          }));
          
          // Update status
          setProfileStatus(userData.status || 'approved');
          
          // Set member since date
          const createdAt = userData.metadata?.createdAt || 
                           userData.createdAt || 
                           userData.created_at ||
                           userData.metadata?.created_at;
          if (createdAt) {
            const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            setMemberSince(date.toLocaleDateString());
          } else {
            setMemberSince('N/A');
          }
        } else if (userResult && userResult.user) {
          // Fallback for different response format
          const userData = userResult.user;
          setProfileData(prev => ({
            displayName: userData.displayName || userData.name || prev.displayName,
            email: userData.email || prev.email,
            bio: userData.bio || prev.bio || '',
            website: userData.website || prev.website || '',
            location: userData.location || prev.location || '',
            twitter: userData.twitter || prev.twitter || '',
            github: userData.github || prev.github || ''
          }));
          setProfileStatus(userData.status || 'approved');
          const date = userData.metadata?.createdAt || userData.created_at;
          setMemberSince(date ? new Date(date).toLocaleDateString() : 'N/A');
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Keep default values on error
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileData();
  }, [currentUser?.id, currentUser?.uid]);

  // Real-time polling for account status and member since (backup)
  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const apiService = (await import('../services/api')).default;
        const res = await apiService.getCurrentUser();
        if (res && (res.user || res.data)) {
          const userData = res.user || res.data;
          setProfileStatus(userData.status || 'approved');
          const date = userData.metadata?.createdAt || userData.created_at;
          if (date) {
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            setMemberSince(dateObj.toLocaleDateString());
          }
        }
      } catch (e) {
        // Silently fail - profile data already loaded
      }
    };
    // Only poll if we haven't loaded profile yet
    if (!profileLoading) {
      fetchStatus();
      interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profileLoading]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    // Validate required fields
    if (!profileData.displayName?.trim()) {
      setMessage('Display name is required.');
      setLoading(false);
      return;
    }
    
    // Validate URL formats if provided
    const urlFields = ['website', 'github'];
    for (const field of urlFields) {
      if (profileData[field] && profileData[field].trim()) {
        try {
          new URL(profileData[field].startsWith('http') ? profileData[field] : `https://${profileData[field]}`);
        } catch {
          setMessage(`Please enter a valid ${field} URL.`);
          setLoading(false);
          return;
        }
      }
    }
    
    try {
      // Use the proper API service instead of direct fetch
      const apiService = (await import('../services/api')).default;
      const result = await apiService.updateProfile({
        displayName: profileData.displayName.trim(),
        bio: profileData.bio?.trim() || '',
        website: profileData.website?.trim() || '',
        location: profileData.location?.trim() || '',
        twitter: profileData.twitter?.trim() || '',
        github: profileData.github?.trim() || ''
      });
      
      if (result.success) {
        // Update the current user in AuthContext
        updateCurrentUser({
          displayName: profileData.displayName.trim()
        });
        
        setMessage('✅ Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setMessage(''), 5000);
      } else {
        const errorMsg = result.error || result.message || 'Failed to update profile';
        setMessage(`❌ ${errorMsg}. Please try again or contact support if the issue persists.`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      let errorMessage = '❌ Error updating profile. ';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
        errorMessage += 'You may need to sign in again. Please refresh the page and try again.';
      } else {
        errorMessage += 'Please try again in a few moments or contact support if the issue persists.';
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Reload original data from Firestore
    try {
      const apiService = (await import('../services/api')).default;
      const userResult = await apiService.getCurrentUser();
      
      if (userResult && userResult.success && userResult.data) {
        const userData = userResult.data;
        setProfileData({
          displayName: userData.displayName || userData.name || currentUser?.displayName || '',
          email: userData.email || currentUser?.email || '',
          bio: userData.bio || '',
          website: userData.website || '',
          location: userData.location || '',
          twitter: userData.twitter || '',
          github: userData.github || ''
        });
      } else if (userResult && userResult.user) {
        const userData = userResult.user;
        setProfileData({
          displayName: userData.displayName || userData.name || currentUser?.displayName || '',
          email: userData.email || currentUser?.email || '',
          bio: userData.bio || '',
          website: userData.website || '',
          location: userData.location || '',
          twitter: userData.twitter || '',
          github: userData.github || ''
        });
      } else {
        // Fallback to currentUser data
        setProfileData({
          displayName: currentUser?.displayName || '',
          email: currentUser?.email || '',
          bio: '',
          website: '',
          location: '',
          twitter: '',
          github: ''
        });
      }
    } catch (error) {
      console.error('Error reloading profile:', error);
      // Fallback to currentUser data
      setProfileData({
        displayName: currentUser?.displayName || '',
        email: currentUser?.email || '',
        bio: '',
        website: '',
        location: '',
        twitter: '',
        github: ''
      });
    }
    setIsEditing(false);
    setMessage('');
  };

  // Password change functionality
  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setMessage('');
    
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmNewPassword
      );
      
      setMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message || 'Error changing password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setMessage('');
  };

  // Quick action handlers
  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleActivityLog = async () => {
    setShowActivityLog(true);
    setActivityLoading(true);
    setActivityLog([]);
    try {
      const apiService = (await import('../services/api')).default;
      const userId = currentUser.id || currentUser.uid;
      const res = await apiService.getUserActivityLog(userId);
      
      // Handle different response formats
      if (res.success) {
        const activities = res.activity_log || res.activity || res.data || [];
        setActivityLog(Array.isArray(activities) ? activities : []);
      } else {
        setActivityLog([]);
      }
    } catch (e) {
      console.error('Error loading activity log:', e);
      setActivityLog([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handlePreferences = async () => {
    setShowPreferences(true);
    setPreferencesLoading(true);
    setPreferencesMessage('');
    try {
      const apiService = (await import('../services/api')).default;
      const userId = currentUser.id || currentUser.uid;
      const res = await apiService.getUserPreferences(userId);
      
      if (res.success && res.preferences) {
        setPreferences({
          theme: res.preferences.theme || 'system',
          notifications: res.preferences.notifications !== undefined ? res.preferences.notifications : true
        });
      } else {
        // Use default preferences if not found
        setPreferences({ theme: 'system', notifications: true });
      }
    } catch (e) {
      console.error('Error loading preferences:', e);
      setPreferencesMessage('Error loading preferences');
      // Use default preferences on error
      setPreferences({ theme: 'system', notifications: true });
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setPreferencesLoading(true);
    setPreferencesMessage('');
    
    try {
      // Use the proper API service for preferences
      const apiService = (await import('../services/api')).default;
      const userId = currentUser.id || currentUser.uid;
      const result = await apiService.updateUserPreferences(userId, preferences);
      
      if (result.success) {
        setPreferencesMessage('✅ Preferences updated successfully!');
        setTheme(preferences.theme); // Apply theme immediately
        setTimeout(() => setPreferencesMessage(''), 5000);
      } else {
        const errorMsg = result.error || result.message || 'Failed to update preferences';
        setPreferencesMessage(`❌ ${errorMsg}. Please try again or contact support if the issue persists.`);
      }
    } catch (error) {
      console.error('Preferences update error:', error);
      let errorMessage = '❌ Error updating preferences. ';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
        errorMessage += 'You may need to sign in again. Please refresh the page and try again.';
      } else {
        errorMessage += 'Please try again in a few moments or contact support if the issue persists.';
      }
      
      setPreferencesMessage(errorMessage);
    } finally {
      setPreferencesLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={handlePasswordCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handlePasswordCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
              <button onClick={() => setShowActivityLog(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {activityLoading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {activityLog.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No recent activity.</div>
                ) : (
                  activityLog.map((log, i) => (
                    <div key={i} className="py-3 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {log.action ? log.action.replace(/_/g, ' ') : log.type || 'Activity'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.details && typeof log.details === 'string' 
                            ? log.details.slice(0, 100) 
                            : log.description || log.message || ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {log.created_at 
                            ? new Date(log.created_at.toDate ? log.created_at.toDate() : log.created_at).toLocaleString()
                            : log.timestamp 
                            ? new Date(log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleString()
                            : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
              <button onClick={() => setShowPreferences(false)} className="text-gray-400 hover:text-gray-600">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              </button>
            </div>
            {preferencesLoading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSavePreferences(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={preferences.theme}
                    onChange={e => setPreferences(p => ({ ...p, theme: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={e => setPreferences(p => ({ ...p, notifications: e.target.checked }))}
                    id="notifications"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">
                    Enable notifications
                  </label>
                </div>
                {preferencesMessage && (
                  <div className="text-sm text-green-600">{preferencesMessage}</div>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowPreferences(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={preferencesLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-pink-300/40 backdrop-blur-xl rounded-2xl p-8 text-white mb-8 shadow-2xl border border-white/30">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || currentUser?.displayName || 'Admin')}&background=6366f1&color=fff&size=120`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 drop-shadow">{profileData.displayName || currentUser?.displayName || 'Admin User'}</h1>
            <p className="text-blue-100 mb-2">{profileData.email || currentUser?.email}</p>
            <p className="text-blue-100">
              {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Administrator'} • DevInquire
            </p>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={profileLoading}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? 'Loading...' : isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-blue-900">Profile Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="md:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-md"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {profileLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profileData.displayName || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <p className="text-gray-900">{profileData.email}</p>
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.bio || 'No bio added yet'}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                ) : (
                  profileData.website ? (
                    <a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-700">
                      {profileData.website}
                    </a>
                  ) : (
                    <p className="text-gray-500 italic">No website added</p>
                  )
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.location || 'No location set'}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.twitter}
                      onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.twitter || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.github}
                      onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="github.com/username"
                    />
                  ) : (
                    profileData.github ? (
                      <a 
                        href={profileData.github.startsWith('http') ? profileData.github : `https://${profileData.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {profileData.github}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">Not set</p>
                    )
                  )}
                </div>
              </div>

              {/* Account Type (Role) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                {currentUser?.role === 'admin' ? (
                  <select
                    value={profileData.role || currentUser.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      setLoading(true);
                      setMessage('');
                      try {
                        const apiService = (await import('../services/api')).default;
                        const userId = currentUser.id || currentUser.uid;
                        const response = await apiService.updateUserRole(userId, newRole);
                        if (response.success) {
                          setProfileData((prev) => ({ ...prev, role: newRole }));
                          setMessage('Account type updated successfully!');
                          setTimeout(() => setMessage(''), 3000);
                        } else {
                          setMessage(response.message || response.error || 'Failed to update account type');
                        }
                      } catch (error) {
                        setMessage('Error updating account type: ' + error.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="user">User</option>
                    <option value="author">Author</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span
                  className="relative cursor-pointer"
                  onMouseEnter={() => setStatusTooltip(true)}
                  onMouseLeave={() => setStatusTooltip(false)}
                >
                  <StatusBadge status={profileStatus} />
                  {profileStatus !== 'approved' && statusTooltip && (
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-black text-white text-xs rounded-lg px-3 py-2 z-50 shadow-xl">
                      {profileStatus === 'pending' && 'Your account is pending admin approval. You cannot post until approved.'}
                      {profileStatus === 'rejected' && 'Your account was rejected. Please contact support.'}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm text-gray-900">{memberSince || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleChangePassword}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Lock className="w-4 h-4 text-blue-600" />
                    </motion.div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Change Password</span>
                </div>
              </button>
              
              <button 
                onClick={handleActivityLog}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Activity className="w-4 h-4 text-green-600" />
                    </motion.div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Activity Log</span>
                </div>
              </button>
              
              <button 
                onClick={handlePreferences}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Settings className="w-4 h-4 text-purple-600" />
                    </motion.div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Preferences</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}