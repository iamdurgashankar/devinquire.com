import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Calendar, User, Tag,
  CheckCircle, Clock, AlertCircle, X, MoreVertical,
  ClipboardList, ArrowUpRight
} from 'lucide-react';

const TaskManagement = () => {
  const { currentUser } = useRBAC();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    category: 'all',
    searchTerm: ''
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: 'content',
    assigneeId: '',
    dueDate: '',
    tags: []
  });

  // Animation variants
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

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, filters]);

  const loadTasks = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockTasks = [
        {
          id: '1',
          title: 'Review Blog Post: Advanced React Patterns',
          description: 'Review and approve the new blog post about advanced React patterns before publication.',
          priority: 'high',
          status: 'in_progress',
          category: 'content',
          assigneeId: 'editor456',
          assigneeName: 'Jane Writer',
          assigneeEmail: 'jane.writer@example.com',
          createdBy: 'admin123',
          createdAt: '2024-01-15T09:00:00Z',
          dueDate: '2024-01-17T17:00:00Z',
          tags: ['blog', 'react', 'review'],
          comments: [
            {
              id: '1',
              userId: 'editor456',
              userName: 'Jane Writer',
              message: 'First draft completed, ready for review',
              timestamp: '2024-01-15T14:30:00Z'
            }
          ]
        },
        {
          id: '2',
          title: 'Client Onboarding: TechCorp Inc.',
          description: 'Complete onboarding process for new client TechCorp Inc. including account setup and initial consultation.',
          priority: 'high',
          status: 'pending',
          category: 'client_management',
          assigneeId: 'admin123',
          assigneeName: 'Admin User',
          assigneeEmail: 'admin@devinquire.com',
          createdBy: 'admin123',
          createdAt: '2024-01-15T08:00:00Z',
          dueDate: '2024-01-16T12:00:00Z',
          tags: ['onboarding', 'client', 'urgent'],
          comments: []
        },
        {
          id: '3',
          title: 'System Maintenance: Database Optimization',
          description: 'Perform routine database optimization and cleanup to improve system performance.',
          priority: 'medium',
          status: 'completed',
          category: 'system',
          assigneeId: 'admin123',
          assigneeName: 'Admin User',
          assigneeEmail: 'admin@devinquire.com',
          createdBy: 'admin123',
          createdAt: '2024-01-14T10:00:00Z',
          dueDate: '2024-01-15T18:00:00Z',
          completedAt: '2024-01-15T16:30:00Z',
          tags: ['maintenance', 'database', 'performance'],
          comments: [
            {
              id: '1',
              userId: 'admin123',
              userName: 'Admin User',
              message: 'Database optimization completed successfully. Performance improved by 25%.',
              timestamp: '2024-01-15T16:30:00Z'
            }
          ]
        },
        {
          id: '4',
          title: 'Content Calendar Planning',
          description: 'Plan content calendar for Q1 2024 including blog posts, social media, and marketing materials.',
          priority: 'medium',
          status: 'in_progress',
          category: 'content',
          assigneeId: 'editor456',
          assigneeName: 'Jane Writer',
          assigneeEmail: 'jane.writer@example.com',
          createdBy: 'admin123',
          createdAt: '2024-01-13T11:00:00Z',
          dueDate: '2024-01-20T17:00:00Z',
          tags: ['planning', 'content', 'calendar'],
          comments: []
        },
        {
          id: '5',
          title: 'Security Audit Review',
          description: 'Review and address findings from the quarterly security audit.',
          priority: 'high',
          status: 'pending',
          category: 'security',
          assigneeId: 'admin123',
          assigneeName: 'Admin User',
          assigneeEmail: 'admin@devinquire.com',
          createdBy: 'admin123',
          createdAt: '2024-01-15T07:00:00Z',
          dueDate: '2024-01-18T17:00:00Z',
          tags: ['security', 'audit', 'compliance'],
          comments: []
        }
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assigneeId === filters.assignee);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      case 'medium': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'low': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'in_progress': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'cancelled': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'content': return <ClipboardList size={18} className="text-violet-500" />;
      case 'client_management': return <User size={18} className="text-sky-500" />;
      case 'system': return <Clock size={18} className="text-amber-500" />;
      case 'security': return <AlertCircle size={18} className="text-rose-500" />;
      case 'marketing': return <ArrowUpRight size={18} className="text-emerald-500" />;
      default: return <Tag size={18} className="text-slate-500" />;
    }
  };

  const handleCreateTask = async () => {
    try {
      const task = {
        ...newTask,
        id: Date.now().toString(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        assigneeName: 'Assigned User', // This would come from user lookup
        assigneeEmail: 'user@example.com',
        comments: []
      };

      setTasks(prev => [task, ...prev]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        category: 'content',
        assigneeId: '',
        dueDate: '',
        tags: []
      });
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
            ...task,
            status: newStatus,
            ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {})
          }
          : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-indigo-600 dark:text-indigo-400" />
            Task Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and track tasks across your organization</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowTaskModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Create Task
        </motion.button>
      </motion.div>

      {/* Task Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <ClipboardList size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Clock size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <CheckCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="content">Content</option>
              <option value="client_management">Client Management</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assignee</label>
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">All Assignees</option>
              <option value="admin123">Admin User</option>
              <option value="editor456">Jane Writer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all dark:text-white"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tasks List */}
      <motion.div
        layout
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tasks ({filteredTasks.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        {getCategoryIcon(task.category)}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{task.title}</h3>
                      <div className="flex gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 mb-4 pl-12">{task.description}</p>

                    <div className="flex flex-wrap items-center gap-6 pl-12 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>{task.assigneeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      {task.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Tag size={14} />
                          <span>{task.tags.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-12 md:pl-0">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <ArrowUpRight size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Create/Edit Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                setShowTaskModal(false);
                setSelectedTask(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedTask ? 'Task Details' : 'Create New Task'}
                </h3>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {selectedTask ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTask.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{selectedTask.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assignee</label>
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <User size={16} />
                          {selectedTask.assigneeName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <Calendar size={16} />
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <ClipboardList size={18} />
                        Comments
                      </h5>
                      <div className="space-y-4">
                        {selectedTask.comments && selectedTask.comments.length > 0 ? (
                          selectedTask.comments.map((comment) => (
                            <div key={comment.id} className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-slate-900 dark:text-white">{comment.userName}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 text-sm">{comment.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 italic">No comments yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:text-white h-32 resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:text-white"
                        >
                          <option value="content">Content</option>
                          <option value="client_management">Client Management</option>
                          <option value="system">System</option>
                          <option value="security">Security</option>
                          <option value="marketing">Marketing</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:text-white"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowTaskModal(false)}
                        className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;
