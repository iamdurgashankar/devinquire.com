import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  Calendar,
  Paperclip,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  PlayCircle,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const ClientRequests = () => {
  const { currentUser } = useRBAC();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setRequests([
        {
          id: 1,
          clientName: 'Acme Corp',
          clientEmail: 'contact@acme.com',
          projectTitle: 'Website Redesign',
          requestType: 'content_update',
          priority: 'high',
          status: 'pending',
          subject: 'Update homepage content',
          message: 'We need to update the homepage content to reflect our new product launch. Please include the new features and benefits.',
          createdAt: '2024-01-15T10:30:00Z',
          dueDate: '2024-01-20T17:00:00Z',
          attachments: ['requirements.pdf']
        },
        {
          id: 2,
          clientName: 'Tech Solutions Inc',
          clientEmail: 'info@techsolutions.com',
          projectTitle: 'Blog Content',
          requestType: 'revision',
          priority: 'medium',
          status: 'in_progress',
          subject: 'Revise technical blog post',
          message: 'The technical blog post needs some revisions. Please make it more accessible to non-technical readers.',
          createdAt: '2024-01-14T14:20:00Z',
          dueDate: '2024-01-18T12:00:00Z',
          attachments: []
        },
        {
          id: 3,
          clientName: 'Creative Agency',
          clientEmail: 'hello@creative.com',
          projectTitle: 'Marketing Materials',
          requestType: 'new_content',
          priority: 'low',
          status: 'completed',
          subject: 'Create new product descriptions',
          message: 'We need product descriptions for our new line of services. Please create engaging and SEO-friendly content.',
          createdAt: '2024-01-12T09:15:00Z',
          dueDate: '2024-01-16T16:00:00Z',
          attachments: ['product-specs.docx'],
          response: 'Product descriptions have been created and delivered. Please review and let us know if any changes are needed.',
          respondedAt: '2024-01-15T11:30:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      cancelled: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    };

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      in_progress: <PlayCircle className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <X className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const handleStatusChange = (requestId, newStatus) => {
    setRequests(requests.map(request =>
      request.id === requestId ? { ...request, status: newStatus } : request
    ));
  };

  const handleSendResponse = (requestId) => {
    if (!responseText.trim()) return;

    setRequests(requests.map(request =>
      request.id === requestId
        ? {
          ...request,
          status: 'completed',
          response: responseText,
          respondedAt: new Date().toISOString()
        }
        : request
    ));

    setSelectedRequest(null);
    setResponseText('');
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

  const isOverdue = (dueDate, status) => {
    return status !== 'completed' && new Date(dueDate) < new Date();
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Client Requests</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and respond to client update requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-4">
        <div className="flex gap-2 flex-wrap bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {filter === status && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-600"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">
                {status === 'all' ? 'All Requests' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {loading ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading requests...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{request.subject}</h3>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                      {isOverdue(request.dueDate, request.status) && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                      <span className="font-medium text-slate-900 dark:text-white mr-2">{request.clientName}</span>
                      <span className="mr-2">•</span>
                      <span>{request.projectTitle}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{request.message}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        Created: {formatDate(request.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Due: {formatDate(request.dueDate)}
                      </span>
                      {request.attachments.length > 0 && (
                        <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                          <Paperclip className="w-4 h-4 mr-1.5" />
                          {request.attachments.length} attachment(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-start justify-end gap-3 min-w-[200px]">
                    {request.status === 'completed' && request.response ? (
                      <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-4">
                        <h4 className="flex items-center font-medium text-emerald-800 dark:text-emerald-400 mb-2">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Response Sent
                        </h4>
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-2 line-clamp-2">{request.response}</p>
                        <p className="text-emerald-600 dark:text-emerald-500 text-xs">
                          {formatDate(request.respondedAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-3">
                        {request.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStatusChange(request.id, 'in_progress')}
                            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Working
                          </motion.button>
                        )}
                        {request.status !== 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedRequest(request)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Response
                          </motion.button>
                        )}
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="pending">Mark as Pending</option>
                          <option value="in_progress">Mark as In Progress</option>
                          <option value="completed">Mark as Completed</option>
                          <option value="cancelled">Mark as Cancelled</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-12 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-700">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No requests found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters.</p>
          </div>
        )}
      </motion.div>

      {/* Response Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Send Response
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">{selectedRequest.subject}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    From: {selectedRequest.clientName}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selectedRequest.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"
                    placeholder="Type your response here..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setResponseText('');
                  }}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendResponse(selectedRequest.id)}
                  disabled={!responseText.trim()}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Response
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientRequests;
