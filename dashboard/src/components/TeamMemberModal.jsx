import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Mail, Phone, Trash2, AlertCircle } from 'lucide-react';

const TeamMemberModal = ({ isOpen, onClose, onAddMember, onRemoveMember, teamMembers }) => {
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'developer',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  // Check if form is valid (required fields filled)
  const isFormValid = () => {
    return newMember.name.trim().length > 0 && newMember.email.trim().length > 0;
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewMember({ name: '', email: '', role: 'developer', status: 'active' });
      setErrors({});
    }
  }, [isOpen]);

  const validateMember = (member) => {
    const errors = {};
    
    if (!member.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!member.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Check if email already exists
    if (teamMembers.some(m => m.email === member.email)) {
      errors.email = 'This email is already in use';
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateMember(newMember);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const memberToAdd = {
      id: Date.now(),
      ...newMember,
      avatar: newMember.name.charAt(0).toUpperCase()
    };

    onAddMember(memberToAdd);
    setNewMember({ name: '', email: '', role: 'developer', status: 'active' });
    setErrors({});
  };

  const handleRemove = (memberId) => {
    onRemoveMember(memberId);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      developer: 'bg-green-100 text-green-800',
      designer: 'bg-pink-100 text-pink-800',
      tester: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      away: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 lg:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[55vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header - Fixed */}
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  Manage Team Members
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Add and manage your team members
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 sm:py-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Add New Member Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Add New Member</h3>
                
                {Object.keys(errors).length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {Object.entries(errors).map(([field, error]) => (
                            <li key={field}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Enter member name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      >
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="manager">Manager</option>
                        <option value="tester">Tester</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={newMember.status}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      >
                        <option value="active">Active</option>
                        <option value="busy">Busy</option>
                        <option value="away">Away</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid()}
                    className="w-full bg-blue-600 text-white px-4 py-2.5 text-sm rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                </form>
              </div>

              {/* Current Team Members */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Current Team Members ({teamMembers.length})</h3>
                
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No team members yet. Add some members to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize border ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize border ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>

          {/* Modal Footer - Fixed */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TeamMemberModal;