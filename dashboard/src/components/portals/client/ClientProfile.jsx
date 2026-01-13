import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Globe,
  Bell,
  Save,
  X,
  Camera,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

const ClientProfile = () => {
  const { currentUser, updateUserProfile } = useRBAC();
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    timezone: '',
    notifications: {
      email: true,
      sms: false,
      projectUpdates: true,
      requestResponses: true,
      weeklyReports: false
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = () => {
    if (currentUser) {
      setProfile({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        company: currentUser.company || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        timezone: currentUser.timezone || '',
        notifications: {
          email: true,
          sms: false,
          projectUpdates: true,
          requestResponses: true,
          weeklyReports: false,
          ...currentUser.notifications
        }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (key) => {
    if (!isEditing) return;
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateUserProfile(currentUser.uid, profile);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50" />
          <div className="relative h-48 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          </div>

          <div className="absolute -bottom-12 left-8 flex items-end space-x-4">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1 shadow-xl ring-4 ring-white/50 dark:ring-slate-700/50">
                <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
              </div>
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors z-10"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            <div className="mb-2 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white drop-shadow-md sm:drop-shadow-none">
                {profile.displayName || 'Client Profile'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 font-medium opacity-90 sm:opacity-100 flex items-center gap-2">
                {profile.company || 'Company Name'}
                {currentUser?.emailVerified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="absolute top-4 right-4 sm:top-auto sm:bottom-4 sm:right-8">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-indigo-600 dark:text-indigo-400 rounded-xl font-medium shadow-sm hover:shadow-md transition-all border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className="px-6 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-400 rounded-xl font-medium shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-indigo-700 transition-all flex items-center space-x-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Message Alert */}
        <AnimatePresence mode="wait">
          {message.text && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className={`rounded-xl p-4 flex items-center space-x-3 ${message.type === 'success'
                ? 'bg-green-50/90 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 backdrop-blur-sm'
                : 'bg-red-50/90 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 backdrop-blur-sm'
                }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 sm:mt-8">
          {/* Left Column - Personal Info */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={true}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700"
                      placeholder="Company Ltd."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <textarea
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows="3"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white resize-none hover:border-indigo-300 dark:hover:border-indigo-700"
                      placeholder="123 Business St, City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Regional Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
                  <div className="relative">
                    <select
                      name="timezone"
                      value={profile.timezone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700"
                    >
                      <option value="">Select Timezone</option>
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (New York)</option>
                      <option value="PST">PST (Los Angeles)</option>
                      <option value="GMT">GMT (London)</option>
                      <option value="IST">IST (India)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Preferences */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Notify when project status changes' },
                  { key: 'requestResponses', label: 'Request Responses', desc: 'Notify when admin responds' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly activity summary' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(item.key)}
                      disabled={!isEditing}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${profile.notifications[item.key] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        } ${!isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security</h2>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm flex items-center justify-between group"
                >
                  <span>Change Password</span>
                  <Activity className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm flex items-center justify-between group"
                >
                  <span>Two-Factor Authentication</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Enabled</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientProfile;
