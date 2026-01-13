import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  MoreHorizontal,
  ChevronDown,
  Briefcase,
  User,
  Calendar
} from 'lucide-react';

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
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const RequestManager = () => {
  const { currentUser } = useRBAC();
  const [requests, setRequests] = useState([]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium',
    project: '',
    category: 'content_update'
  });

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadRequests();
    loadProjects();
  }, []);

  const loadRequests = () => {
    setLoading(true);
    // Mock data - replace with actual API calls
    setTimeout(() => {
      const mockRequests = [
        {
          id: 1,
          title: 'Update Homepage Hero Section',
          description: 'Please update the hero section text to reflect our new product launch. The current text is outdated and needs to be more compelling.',
          priority: 'high',
          status: 'pending',
          category: 'content_update',
          project: 'Website Redesign',
          projectId: 1,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          response: null,
          editor: 'John Editor'
        },
        {
          id: 2,
          title: 'Add New Blog Post Category',
          description: 'We need to add a new category called "Product Updates" to the blog section. This will help organize our product-related content better.',
          priority: 'medium',
          status: 'in_progress',
          category: 'feature_request',
          project: 'Blog Content Creation',
          projectId: 2,
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          response: {
            message: 'Working on implementing the new category. Will have it ready by tomorrow.',
            respondedAt: '2024-01-14T16:45:00Z'
          },
          editor: 'Jane Writer'
        },
        {
          id: 3,
          title: 'Fix Mobile Navigation Issue',
          description: 'The mobile navigation menu is not working properly on iOS devices. Users report that the menu doesn\'t close after selecting an item.',
          priority: 'high',
          status: 'completed',
          category: 'bug_report',
          project: 'Website Redesign',
          projectId: 1,
          createdAt: '2024-01-13T09:15:00Z',
          updatedAt: '2024-01-13T17:30:00Z',
          response: {
            message: 'Fixed the mobile navigation issue. The menu now properly closes on iOS devices. Changes have been deployed to production.',
            respondedAt: '2024-01-13T17:30:00Z'
          },
          editor: 'John Editor'
        },
        {
          id: 4,
          title: 'Update Contact Information',
          description: 'Please update the contact information in the footer. Our phone number has changed and we have a new office address.',
          priority: 'low',
          status: 'pending',
          category: 'content_update',
          project: 'Website Redesign',
          projectId: 1,
          createdAt: '2024-01-12T11:45:00Z',
          updatedAt: '2024-01-12T11:45:00Z',
          response: null,
          editor: 'John Editor'
        }
      ];
      setRequests(mockRequests);
      setLoading(false);
    }, 1000);
  };

  const loadProjects = () => {
    // Mock projects data
    setProjects([
      { id: 1, name: 'Website Redesign' },
      { id: 2, name: 'Blog Content Creation' },
      { id: 3, name: 'Marketing Materials' },
      { id: 4, name: 'E-commerce Platform' }
    ]);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();

    const request = {
      id: Date.now(),
      ...newRequest,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      response: null,
      editor: 'Assigned Editor' // This would be determined by the system
    };

    setRequests([request, ...requests]);
    setNewRequest({
      title: '',
      description: '',
      priority: 'medium',
      project: '',
      category: 'content_update'
    });
    setShowNewRequestForm(false);
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      cancelled: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      medium: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      high: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${styles[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      content_update: <FileText size={20} className="text-blue-500" />,
      feature_request: <Plus size={20} className="text-purple-500" />,
      bug_report: <AlertCircle size={20} className="text-rose-500" />,
      design_change: <Briefcase size={20} className="text-pink-500" />,
      other: <MessageSquare size={20} className="text-slate-500" />
    };
    return icons[category] || <MessageSquare size={20} className="text-slate-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Request Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Submit and track your update requests to editors.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewRequestForm(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-2"
        >
          <Plus size={20} />
          New Request
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl inline-flex flex-wrap gap-1 border border-slate-200/60 dark:border-slate-700/60">
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'completed', label: 'Completed' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterOption.key
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            {filter === filterOption.key && (
              <motion.div
                layoutId="activeRequestFilter"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{filterOption.label}</span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <motion.div
        layout
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredRequests.map((request) => (
            <motion.div
              layout
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              key={request.id}
              className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              <div className="p-6">
                {/* Request Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ring-1 ring-slate-900/5 dark:ring-slate-100/5">
                      {getCategoryIcon(request.category)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {request.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50">
                          <Briefcase size={14} />
                          {request.project}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          {request.editor}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                {/* Request Description */}
                <p className="text-slate-600 dark:text-slate-300 mb-6 pl-16 leading-relaxed">{request.description}</p>

                {/* Request Details */}
                <div className="pl-16 flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Created: {formatDate(request.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Updated: {formatDate(request.updatedAt)}
                  </span>
                </div>

                {/* Response */}
                <div className="pl-16">
                  {request.response ? (
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-1">Editor Response</h4>
                          <p className="text-indigo-800 dark:text-indigo-200/80 mb-2 text-sm leading-relaxed">{request.response.message}</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Clock size={12} />
                            Responded: {formatDate(request.response.respondedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    request.status === 'pending' && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-3 inline-flex">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                          <span className="text-amber-800 dark:text-amber-300 text-sm font-medium">Waiting for editor response...</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-700/60"
        >
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No requests found</h3>
          <p className="text-slate-600 dark:text-slate-400">No requests match the selected filter.</p>
        </motion.div>
      )}

      {/* New Request Modal */}
      <AnimatePresence>
        {showNewRequestForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewRequestForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 custom-scrollbar border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 z-20">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <Send size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Submit New Request
                </h2>
                <button
                  onClick={() => setShowNewRequestForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Request Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="Brief description of your request"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Project <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={newRequest.project}
                        onChange={(e) => setNewRequest({ ...newRequest, project: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-600/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.name}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={newRequest.category}
                        onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="content_update">Content Update</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="bug_report">Bug Report</option>
                        <option value="design_change">Design Change</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['low', 'medium', 'high'].map((p) => (
                      <label key={p} className={`flex-1 cursor-pointer relative group`}>
                        <input
                          type="radio"
                          name="priority"
                          value={p}
                          checked={newRequest.priority === p}
                          onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`text-center py-3 rounded-xl border-2 transition-all font-medium capitalize ${newRequest.priority === p
                          ? p === 'high' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 shadow-sm'
                            : p === 'medium' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm'
                              : 'border-slate-500 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                          }`}>
                          {p}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                    placeholder="Provide detailed information about your request..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all transform active:scale-95 flex items-center gap-2"
                  >
                    <Send size={18} />
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RequestManager;