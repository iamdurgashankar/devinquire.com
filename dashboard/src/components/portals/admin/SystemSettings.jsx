import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Shield,
  Bell,
  Server,
  Save,
  Loader,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Mail,
  Zap
} from 'lucide-react';

const SystemSettings = () => {
  const { currentUser } = useRBAC();
  const [settings, setSettings] = useState({
    general: {
      siteName: 'DevInquire Dashboard',
      siteDescription: 'Professional content management system',
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'CLIENT'
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowPasswordReset: true,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      adminAlerts: true,
      userWelcomeEmail: true
    },
    api: {
      rateLimit: 100,
      apiKeyRequired: true,
      corsEnabled: true,
      debugMode: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Mock data loading - replace with actual API call
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Mock save operation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Settings saved:', settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe, description: 'Basic system configuration' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Security policies & access' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & push alerts' },
    { id: 'api', label: 'API', icon: Server, description: 'API configuration & limits' }
  ];

  const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {description && <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
          }`}
      >
        <span
          className={`${checked ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
        />
      </button>
    </div>
  );

  const InputField = ({ label, type = 'text', value, onChange, icon: Icon, ...props }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-400`}
          {...props}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-pulse" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : showSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? 'Saving...' : showSuccess ? 'Saved!' : 'Save Changes'}</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-200/60 dark:border-slate-700/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-xs opacity-70 hidden xl:block line-clamp-1">{tab.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 lg:p-8"
          >
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">General Configuration</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Basic site information and settings</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Site Name"
                      value={settings.general.siteName}
                      onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Default User Role
                      </label>
                      <select
                        value={settings.general.defaultUserRole}
                        onChange={(e) => handleSettingChange('general', 'defaultUserRole', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                      >
                        <option value="CLIENT">Client</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Site Description
                    </label>
                    <textarea
                      value={settings.general.siteDescription}
                      onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    System Status
                  </h3>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <Toggle
                      label="Maintenance Mode"
                      description="Temporarily disable access for non-admin users"
                      checked={settings.general.maintenanceMode}
                      onChange={(checked) => handleSettingChange('general', 'maintenanceMode', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="Allow User Registration"
                      description="Enable new users to create accounts"
                      checked={settings.general.allowRegistration}
                      onChange={(checked) => handleSettingChange('general', 'allowRegistration', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Access Control</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Security parameters and restrictions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField
                      label="Session Timeout (min)"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                    <InputField
                      label="Min Password Length"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                    <InputField
                      label="Max Login Attempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500" />
                    Security Policies
                  </h3>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <Toggle
                      label="Require Two-Factor Authentication"
                      description="Enforce 2FA for all admin accounts"
                      checked={settings.security.requireTwoFactor}
                      onChange={(checked) => handleSettingChange('security', 'requireTwoFactor', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="Allow Password Reset"
                      description="Users can reset forgotten passwords via email"
                      checked={settings.security.allowPasswordReset}
                      onChange={(checked) => handleSettingChange('security', 'allowPasswordReset', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Channels</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage how the system communicates</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 max-w-2xl">
                    <Toggle
                      label="Email Notifications"
                      description="Send important updates via email"
                      checked={settings.notifications.emailNotifications}
                      onChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="Push Notifications"
                      description="Enable browser push notifications"
                      checked={settings.notifications.pushNotifications}
                      onChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Alert Types
                  </h3>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 max-w-2xl">
                    <Toggle
                      label="Admin Alerts"
                      description="Notify admins of critical system events"
                      checked={settings.notifications.adminAlerts}
                      onChange={(checked) => handleSettingChange('notifications', 'adminAlerts', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="User Welcome Email"
                      description="Send greeting email upon registration"
                      checked={settings.notifications.userWelcomeEmail}
                      onChange={(checked) => handleSettingChange('notifications', 'userWelcomeEmail', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Configuration</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Developer settings and limits</p>
                    </div>
                  </div>

                  <div className="max-w-md">
                    <InputField
                      label="Rate Limit (requests per minute)"
                      type="number"
                      value={settings.api.rateLimit}
                      onChange={(e) => handleSettingChange('api', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Access & Security
                  </h3>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 max-w-2xl">
                    <Toggle
                      label="API Key Required"
                      description="Enforce API key authentication for all endpoints"
                      checked={settings.api.apiKeyRequired}
                      onChange={(checked) => handleSettingChange('api', 'apiKeyRequired', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="CORS Enabled"
                      description="Allow Cross-Origin Resource Sharing"
                      checked={settings.api.corsEnabled}
                      onChange={(checked) => handleSettingChange('api', 'corsEnabled', checked)}
                    />
                    <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                    <Toggle
                      label="Debug Mode"
                      description="Enable detailed error logging (Not for production)"
                      checked={settings.api.debugMode}
                      onChange={(checked) => handleSettingChange('api', 'debugMode', checked)}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
