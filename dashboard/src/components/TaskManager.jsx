import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import TeamMemberModal from './TeamMemberModal';
import firestoreService from '../services/firestoreService';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  User, 
  UserPlus,
  Calendar,
  Tag,
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Users,
  Timer,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Award,
  Bell,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Save,
  X,
  GripVertical,
  Send,
  Check,
  List
} from 'lucide-react';

export default function TaskManager() {
  const { user } = useAuth();
  
  // State Management
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [activeTimers, setActiveTimers] = useState(new Set());
  const [formErrors, setFormErrors] = useState({});
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: 'development'
  });
  // Enhanced collaboration features
  const [teamMembers, setTeamMembers] = useState([]);
  const [taskComments, setTaskComments] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentingTaskId, setCommentingTaskId] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressTaskId, setProgressTaskId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState(null);

  // Collaboration functions
  // Enhanced team member management
  const addTeamMember = async (memberData) => {
    try {
      const newMember = {
        id: Date.now(),
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        avatar: memberData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        status: 'online',
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'anonymous'
      };
      
      await firestoreService.createDocument('teamMembers', newMember);
      addNotification('team', `${newMember.name} added to team`);
    } catch (error) {
      console.error('Error adding team member:', error);
      addNotification('error', 'Failed to add team member');
    }
  };

  const removeTeamMember = async (memberId) => {
    try {
      const member = teamMembers.find(m => m.id === memberId);
      
      // Remove from Firestore
      await firestoreService.deleteDocument('teamMembers', memberId.toString());
      
      // Update all tasks to remove this member from assignments
      const tasksToUpdate = tasks.filter(task => 
        task.assignees && task.assignees.includes(memberId)
      );
      
      for (const task of tasksToUpdate) {
        const updatedTask = {
          ...task,
          assignees: task.assignees.filter(id => id !== memberId),
          assigneeNames: task.assigneeNames.filter(name => name !== member?.name),
          updatedAt: new Date().toISOString()
        };
        await firestoreService.updateDocument('tasks', task.id.toString(), updatedTask);
      }
      
      addNotification('team', `${member?.name} removed from team`);
    } catch (error) {
      console.error('Error removing team member:', error);
      addNotification('error', 'Failed to remove team member');
    }
  };

  // Enhanced form validation
  const validateTaskForm = (formData) => {
    const errors = {};
    
    if (!formData.get('title')?.trim()) {
      errors.title = 'Task title is required';
    }
    
    if (formData.get('title')?.trim().length > 100) {
      errors.title = 'Task title must be less than 100 characters';
    }
    
    if (formData.get('description')?.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    const dueDate = formData.get('dueDate');
    if (dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    
    const estimatedHours = parseFloat(formData.get('estimatedHours'));
    if (estimatedHours && (estimatedHours < 0.5 || estimatedHours > 1000)) {
      errors.estimatedHours = 'Estimated hours must be between 0.5 and 1000';
    }
    
    return errors;
  };

  const addComment = (taskId, comment) => {
    const newCommentObj = {
      id: Date.now(),
      text: comment,
      author: 'Current User',
      timestamp: new Date().toISOString(),
      avatar: 'CU'
    };
    
    setTaskComments(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), newCommentObj]
    }));
    
    // Add notification
    addNotification('comment', `New comment added to task`);
    setNewComment('');
    setCommentingTaskId(null);
  };

  const addNotification = (type, message) => {
    const notification = {
      id: Date.now(),
      type,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const assignTaskToMembers = (taskId, memberIds) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const assignedMembers = teamMembers.filter(member => memberIds.includes(member.id));
        return {
          ...task,
          assignees: memberIds,
          assigneeNames: assignedMembers.map(m => m.name)
        };
      }
      return task;
    }));
    
    addNotification('assignment', `Task assigned to ${memberIds.length} team member(s)`);
  };

  const getTeamMemberStatus = (status) => {
    const statusColors = {
      online: 'bg-green-100 text-green-700 border-green-200',
      away: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      offline: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Enhanced time tracking and progress management
  const [timeLogs, setTimeLogs] = useState({});
  const [timerStartTimes, setTimerStartTimes] = useState({});
  const [productivityStats, setProductivityStats] = useState({
    todayHours: 0,
    weekHours: 0,
    completedToday: 0,
    averageTaskTime: 0
  });
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  // Time tracking functions
  const startTimer = (taskId) => {
    setActiveTimers(prev => new Set([...prev, taskId]));
    setTimerStartTimes(prev => ({
      ...prev,
      [taskId]: Date.now()
    }));
    addNotification('timer', `Timer started for task`);
  };

  const stopTimer = (taskId) => {
    const startTime = timerStartTimes[taskId];
    if (startTime) {
      const duration = Date.now() - startTime;
      const hours = duration / (1000 * 60 * 60);
      
      // Log the time
      setTimeLogs(prev => ({
        ...prev,
        [taskId]: [
          ...(prev[taskId] || []),
          {
            id: Date.now(),
            startTime: new Date(startTime),
            endTime: new Date(),
            duration: duration,
            hours: hours
          }
        ]
      }));

      // Update productivity stats
      setProductivityStats(prev => ({
        ...prev,
        todayHours: prev.todayHours + hours,
        weekHours: prev.weekHours + hours
      }));

      setActiveTimers(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });

      setTimerStartTimes(prev => {
        const newTimes = { ...prev };
        delete newTimes[taskId];
        return newTimes;
      });

      addNotification('timer', `Timer stopped. Logged ${hours.toFixed(2)} hours`);
    }
  };

  const getTotalTimeSpent = (taskId) => {
    const logs = timeLogs[taskId] || [];
    return logs.reduce((total, log) => total + log.hours, 0);
  };

  const getTaskProgress = (task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(st => st.completed).length;
      return Math.round((completed / task.subtasks.length) * 100);
    }
    return task.progress || 0;
  };

  const updateTaskProgress = (taskId, progress) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, progress };
        
        // Auto-complete if progress reaches 100%
        if (progress >= 100 && task.status !== 'completed') {
          updatedTask.status = 'completed';
          updatedTask.completedAt = new Date().toISOString();
          setProductivityStats(prev => ({
            ...prev,
            completedToday: prev.completedToday + 1
          }));
          addNotification('completion', `Task "${task.title}" completed!`);
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

  const getProductivityInsights = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    
    return {
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueRate: totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0,
      activeRate: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0,
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks
    };
  };

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    assignee: 'all',
    dateRange: 'all'
  });

  // Load data and setup real-time synchronization
  useEffect(() => {
    let taskListenerId = null;
    let teamListenerId = null;
    let initialLoadComplete = false;
    let timeoutId = null;
    
    const loadData = async () => {
      setLoading(true);
      initialLoadComplete = false;
      
      // Set a timeout to ensure loading doesn't stay true forever
      timeoutId = setTimeout(() => {
        if (!initialLoadComplete) {
          console.warn('Task loading timeout - setting loading to false');
          setLoading(false);
          initialLoadComplete = true;
        }
      }, 5000); // 5 second timeout
      
      try {
        // Check if Firestore is available before attempting to load
        if (!firestoreService.isAvailable()) {
          console.warn('Firestore is not available - using empty data');
          setTasks([]);
          setTeamMembers([]);
          setLoading(false);
          initialLoadComplete = true;
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        
        // Load tasks from Firestore with real-time updates
        taskListenerId = await firestoreService.listenToCollection(
          'tasks',
          (result) => {
            // Handle the callback result structure
            if (result && result.success && result.data !== undefined) {
              setTasks(result.data || []);
              // Only set loading to false on first successful load
              if (!initialLoadComplete) {
                setLoading(false);
                initialLoadComplete = true;
                if (timeoutId) clearTimeout(timeoutId);
              }
            } else if (result && !result.success) {
              console.error('Error loading tasks:', result.error);
              // On error, still set loading to false and use empty array
              setTasks([]);
              if (!initialLoadComplete) {
                setLoading(false);
                initialLoadComplete = true;
                if (timeoutId) clearTimeout(timeoutId);
              }
            }
          },
          {
            orderByField: 'createdAt',
            orderByDirection: 'desc'
          }
        );

        // Load team members from Firestore with real-time updates
        teamListenerId = await firestoreService.listenToCollection(
          'teamMembers',
          (result) => {
            // Handle the callback result structure
            if (result && result.success && result.data !== undefined) {
              setTeamMembers(result.data || []);
            } else if (result && !result.success) {
              console.error('Error loading team members:', result.error);
              setTeamMembers([]);
            }
          },
          {
            orderByField: 'name',
            orderByDirection: 'asc'
          }
        );
      } catch (error) {
        console.error('Error setting up data listeners:', error);
        // Fallback to empty data if Firebase is not available
        setTasks([]);
        setTeamMembers([]);
        setLoading(false);
        initialLoadComplete = true;
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    loadData();

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (taskListenerId) {
        firestoreService.stopListening(taskListenerId);
      }
      if (teamListenerId) {
        firestoreService.stopListening(teamListenerId);
      }
    };
  }, []);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time task updates
      setTasks(prevTasks => 
        prevTasks.map(task => ({
          ...task,
          timeSpent: activeTimers.has(task.id) ? task.timeSpent + 0.1 : task.timeSpent
        }))
      );
    }, 6000); // Update every 6 seconds for demo

    return () => clearInterval(interval);
  }, [activeTimers]);

  // Filter tasks
  const filterTasks = useCallback(() => {
    let filtered = tasks;

    if (filters.search) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assignees.includes(parseInt(filters.assignee)));
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(task => {
        const dueDate = new Date(task.dueDate);
        switch (filters.dateRange) {
          case 'today':
            return dueDate.toDateString() === now.toDateString();
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate <= weekFromNow;
          case 'overdue':
            return dueDate < now && task.status !== 'completed';
          default:
            return true;
        }
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, filters]);

  useEffect(() => {
    filterTasks();
  }, [filterTasks]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Check if form is valid (required fields filled)
  const isFormValid = () => {
    return formValues.title.trim().length > 0;
  };

  // Handle form field changes
  const handleFormFieldChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Helper function to close and reset modal
  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
    setFormErrors({});
    setFormValues({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      category: 'development'
    });
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showCreateModal || editingTask) {
      if (editingTask) {
        setFormValues({
          title: editingTask.title || '',
          description: editingTask.description || '',
          priority: editingTask.priority || 'medium',
          status: editingTask.status || 'pending',
          category: editingTask.category || 'development'
        });
      } else {
        setFormValues({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          category: 'development'
        });
      }
      setFormErrors({});
    }
  }, [showCreateModal, editingTask]);

  // Enhanced task creation with validation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      category: formData.get('category'),
      dueDate: formData.get('dueDate'),
      estimatedHours: parseFloat(formData.get('estimatedHours')),
      tags: formData.get('tags')?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      progress: editingTask ? parseInt(formData.get('progress')) : 0
    };

    // Validate form data
    const errors = validateTaskForm(taskData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const assignees = Array.from(formData.getAll('assignees')).map(id => parseInt(id));
    const assigneeNames = assignees.map(id => 
      teamMembers.find(member => member.id === id)?.name
    ).filter(Boolean);

    const newTask = {
      id: editingTask ? editingTask.id : Date.now(),
      ...taskData,
      assignees,
      assigneeNames,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeSpent: editingTask ? editingTask.timeSpent : 0,
      subtasks: editingTask ? editingTask.subtasks : [],
      comments: editingTask ? editingTask.comments : [],
      attachments: editingTask ? editingTask.attachments : [],
      createdBy: user?.uid || 'anonymous'
    };

    try {
      if (editingTask) {
        // Update task in Firestore
        await firestoreService.updateDocument('tasks', editingTask.id.toString(), newTask);
        addNotification('success', `Task "${taskData.title}" updated successfully`);
      } else {
        // Create new task in Firestore
        await firestoreService.createDocument('tasks', newTask);
        addNotification('success', `Task "${taskData.title}" created successfully`);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      addNotification('error', `Failed to ${editingTask ? 'update' : 'create'} task`);
      return;
    }

    // Reset form and close modal
    closeModal();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        status: newStatus,
        progress: newStatus === 'completed' ? 100 : task.progress || 0,
        updatedAt: new Date().toISOString()
      };
      
      if (newStatus === 'completed') {
        updatedTask.completedAt = new Date().toISOString();
      }

      await firestoreService.updateDocument('tasks', taskId.toString(), updatedTask);
      addNotification('success', `Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      addNotification('error', 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await firestoreService.deleteDocument('tasks', taskId.toString());
      addNotification('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      addNotification('Failed to delete task', 'error');
    }
  };

  // Timer Functions
  const handleStartTimer = (taskId) => {
    setActiveTimers(prev => new Set([...prev, taskId]));
    addNotification('Timer started', 'info');
  };

  const handleStopTimer = (taskId) => {
    setActiveTimers(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
    addNotification('Timer stopped', 'info');
  };

  // Drag and Drop Functions
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      handleStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  // Comment Functions
  const handleAddComment = (taskId, message) => {
    const newComment = {
      id: Date.now(),
      userId: user?.id || 1,
      userName: user?.name || 'Current User',
      message,
      timestamp: new Date().toISOString()
    };

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, newComment] }
        : task
    ));
  };

  // Subtask Functions
  const handleToggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: task.subtasks.map(subtask =>
              subtask.id === subtaskId 
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            )
          }
        : task
    ));
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus) => {
    try {
      const tasksToUpdate = tasks.filter(task => selectedTasks.includes(task.id));
      
      for (const task of tasksToUpdate) {
        const updatedTask = {
          ...task,
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : task.progress,
          updatedAt: new Date().toISOString()
        };
        
        if (newStatus === 'completed') {
          updatedTask.completedAt = new Date().toISOString();
        }
        
        await firestoreService.updateDocument('tasks', task.id.toString(), updatedTask);
      }
      
    setSelectedTasks([]);
      addNotification('success', `${tasksToUpdate.length} task(s) updated successfully`);
    } catch (error) {
      console.error('Error updating tasks:', error);
      addNotification('error', 'Failed to update tasks');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const tasksToDelete = tasks.filter(task => selectedTasks.includes(task.id));
      
      for (const task of tasksToDelete) {
        await firestoreService.deleteDocument('tasks', task.id.toString());
      }
      
    setSelectedTasks([]);
      addNotification('success', `${tasksToDelete.length} task(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting tasks:', error);
      addNotification('error', 'Failed to delete tasks');
    }
  };

  // Enhanced Bulk Assignment
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignMembers, setBulkAssignMembers] = useState([]);

  const handleBulkAssign = async (memberIds) => {
    try {
      const tasksToUpdate = tasks.filter(task => selectedTasks.includes(task.id));
      
      for (const task of tasksToUpdate) {
        const assignedMembers = teamMembers.filter(member => memberIds.includes(member.id));
        const updatedTask = {
          ...task,
          assignees: [...new Set([...(task.assignees || []), ...memberIds])],
          assigneeNames: [...new Set([...(task.assigneeNames || []), ...assignedMembers.map(m => m.name)])],
          updatedAt: new Date().toISOString()
        };
        
        await firestoreService.updateDocument('tasks', task.id.toString(), updatedTask);
      }
      
      setSelectedTasks([]);
      setShowBulkAssignModal(false);
      setBulkAssignMembers([]);
      addNotification('success', `Tasks assigned to ${memberIds.length} member(s)`);
    } catch (error) {
      console.error('Error assigning tasks:', error);
      addNotification('error', 'Failed to assign tasks');
    }
  };

  // Enhanced Progress Update
  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        progress: Math.max(0, Math.min(100, newProgress)),
        updatedAt: new Date().toISOString()
      };

      // Auto-complete if progress reaches 100%
      if (updatedTask.progress >= 100 && task.status !== 'completed') {
        updatedTask.status = 'completed';
        updatedTask.completedAt = new Date().toISOString();
        addNotification('success', `Task "${task.title}" completed!`);
      }

      await firestoreService.updateDocument('tasks', taskId.toString(), updatedTask);
      updateTaskProgress(taskId, updatedTask.progress);
    } catch (error) {
      console.error('Error updating progress:', error);
      addNotification('error', 'Failed to update progress');
    }
  };

  // Enhanced Task Assignment
  const handleAssignTask = async (taskId, memberIds) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const assignedMembers = teamMembers.filter(member => memberIds.includes(member.id));
      const updatedTask = {
        ...task,
        assignees: memberIds,
        assigneeNames: assignedMembers.map(m => m.name),
        updatedAt: new Date().toISOString()
      };

      await firestoreService.updateDocument('tasks', taskId.toString(), updatedTask);
      addNotification('success', `Task assigned to ${assignedMembers.length} member(s)`);
    } catch (error) {
      console.error('Error assigning task:', error);
      addNotification('error', 'Failed to assign task');
    }
  };

  // Quick Actions
  const handleQuickDuplicate = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const duplicatedTask = {
        ...task,
        id: Date.now(),
        title: `${task.title} (Copy)`,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        timeSpent: 0,
        comments: [],
        attachments: []
      };

      delete duplicatedTask.id; // Remove old ID so Firestore creates a new one
      await firestoreService.createDocument('tasks', duplicatedTask);
      addNotification('success', 'Task duplicated successfully');
    } catch (error) {
      console.error('Error duplicating task:', error);
      addNotification('error', 'Failed to duplicate task');
    }
  };

  const handleQuickArchive = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        status: 'archived',
        updatedAt: new Date().toISOString()
      };

      await firestoreService.updateDocument('tasks', taskId.toString(), updatedTask);
      addNotification('success', 'Task archived successfully');
    } catch (error) {
      console.error('Error archiving task:', error);
      addNotification('error', 'Failed to archive task');
    }
  };

  // Utility Functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on_hold': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'development': return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'design': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'marketing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'research': return <Search className="w-4 h-4 text-orange-600" />;
      case 'testing': return <Target className="w-4 h-4 text-red-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeSpent = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && getDaysUntilDue(dueDate) < 0;
  };

  // Notification Functions (removed duplicate declaration)

  // Statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed').length
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`px-4 py-2 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-500 text-white' :
                notification.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Organize and track your team's progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              List
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'assignment' ? 'bg-blue-500' :
                              notification.type === 'comment' ? 'bg-green-500' :
                              notification.type === 'deadline' ? 'bg-red-500' : 'bg-gray-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Team Panel */}
            <div className="relative">
              <button
                onClick={() => setShowTeamPanel(!showTeamPanel)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>
              
              {showTeamPanel && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Team Members</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {teamMembers.map(member => (
                      <div key={member.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getTeamMemberStatus(member.status)}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            member.status === 'online' ? 'bg-green-100 text-green-700' :
                            member.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Productivity Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {getProductivityInsights().completionRate}% completion rate
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {getProductivityInsights().activeRate}% of total tasks
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <Award className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">
              +{productivityStats.completedToday} today
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-red-600">
              {getProductivityInsights().overdueRate}% of total tasks
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Today</p>
              <p className="text-2xl font-bold text-purple-600">
                {productivityStats.todayHours.toFixed(1)}h
              </p>
            </div>
            <Timer className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <button
              onClick={() => setShowTimeTracker(!showTimeTracker)}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              View details
            </button>
          </div>
        </div>
      </div>

      {/* Time Tracker Panel */}
      {showTimeTracker && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Time Tracking Analytics</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                onClick={() => setShowTimeTracker(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                  <p className="text-xl font-bold text-blue-900">
                    {selectedTimeRange === 'today' ? productivityStats.todayHours.toFixed(1) : 
                     selectedTimeRange === 'week' ? productivityStats.weekHours.toFixed(1) : 
                     productivityStats.weekHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Avg per Task</p>
                  <p className="text-xl font-bold text-green-900">
                    {productivityStats.averageTaskTime.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Productivity</p>
                  <p className="text-xl font-bold text-purple-900">
                    {getProductivityInsights().completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Timers */}
          {activeTimers.size > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Active Timers</h4>
              <div className="space-y-2">
                {Array.from(activeTimers).map(taskId => {
                  const task = tasks.find(t => t.id === taskId);
                  const startTime = timerStartTimes[taskId];
                  return task ? (
                    <div key={taskId} className="flex items-center justify-between bg-white rounded p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {startTime ? formatDuration(Date.now() - startTime) : '0h 0m'}
                        </span>
                        <button
                          onClick={() => stopTimer(taskId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="research">Research</option>
            <option value="testing">Testing</option>
            <option value="meeting">Meeting</option>
          </select>
          <select
            value={filters.assignee}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Views */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['pending', 'in_progress', 'completed', 'on_hold'].map(status => (
            <div
              key={status}
              className="bg-gray-50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3 className="font-semibold text-gray-900 mb-4 capitalize">
                {status.replace('_', ' ')} ({filteredTasks.filter(t => t.status === status).length})
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTasks
                    .filter(task => task.status === status)
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                        onStatusChange={handleStatusChange}
                        onEdit={setEditingTask}
                        onDelete={handleDeleteTask}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        isTimerActive={activeTimers.has(task.id)}
                        teamMembers={teamMembers}
                        onToggleSubtask={handleToggleSubtask}
                        onAddComment={handleAddComment}
                        onProgressUpdate={handleProgressUpdate}
                        onAssignTask={handleAssignTask}
                        onDuplicate={handleQuickDuplicate}
                        onArchive={handleQuickArchive}
                      />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingTask}
                    onDelete={handleDeleteTask}
                    onStartTimer={handleStartTimer}
                    onStopTimer={handleStopTimer}
                    isTimerActive={activeTimers.has(task.id)}
                    teamMembers={teamMembers}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Creation/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTask) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 lg:p-6"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
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
                      {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {editingTask ? 'Update task details and save changes' : 'Fill in the details to create a new task'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 sm:py-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <form onSubmit={handleCreateTask} id="task-form" className="space-y-4 sm:space-y-5">
                  {/* Display form errors */}
                  {Object.keys(formErrors).length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {Object.entries(formErrors).map(([field, error]) => (
                              <li key={field}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formValues.title}
                      onChange={(e) => handleFormFieldChange('title', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      placeholder="Enter task title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editingTask?.description || ''}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                        formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      placeholder="Enter task description (optional)..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Priority
                      </label>
                      <select
                        name="priority"
                        defaultValue={editingTask?.priority || 'medium'}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={editingTask?.status || 'pending'}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editingTask?.category || 'development'}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      >
                        <option value="development">Development</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="research">Research</option>
                        <option value="testing">Testing</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        defaultValue={editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        min="0.5"
                        step="0.5"
                        defaultValue={editingTask?.estimatedHours || 1}
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          formErrors.estimatedHours ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                      <Users className="w-4 h-4 text-gray-500" />
                      Assign To
                    </label>
                    <div className="space-y-2 max-h-36 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Team Members</span>
                        <button
                          type="button"
                          onClick={() => setShowTeamModal(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Member
                        </button>
                      </div>
                      {teamMembers.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No team members available. 
                          <button
                            type="button"
                            onClick={() => setShowTeamModal(true)}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            Add some members
                          </button>
                        </div>
                      ) : (
                        teamMembers.map(member => (
                          <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              name="assignees"
                              value={member.id}
                              defaultChecked={editingTask?.assignees?.includes(member.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {member.name.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-700">{member.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${getTeamMemberStatus(member.status)}`}>
                                {member.status || 'offline'}
                              </span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      defaultValue={editingTask?.tags?.join(', ') || ''}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                      placeholder="e.g., frontend, urgent, client-work"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Separate multiple tags with commas</p>
                  </div>

                  {/* Enhanced Progress Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Progress: {editingTask ? editingTask.progress : 0}%
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        name="progress"
                        min="0"
                        max="100"
                        step="5"
                        defaultValue={editingTask?.progress || 0}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        onChange={(e) => {
                          const value = e.target.value;
                          const label = e.target.previousElementSibling;
                          label.textContent = `Progress: ${value}%`;
                          
                          // Update progress bar color
                          const progress = parseInt(value);
                          e.target.style.background = `linear-gradient(to right, 
                            ${progress >= 80 ? '#10b981' : progress >= 50 ? '#3b82f6' : progress >= 25 ? '#f59e0b' : '#ef4444'} 0%, 
                            ${progress >= 80 ? '#10b981' : progress >= 50 ? '#3b82f6' : progress >= 25 ? '#f59e0b' : '#ef4444'} ${progress}%, 
                            #e5e7eb ${progress}%, 
                            #e5e7eb 100%)`;
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span className="font-medium">{editingTask?.progress || 0}%</span>
                        <span>100%</span>
                    </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input[type="range"]');
                            input.value = '25';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input[type="range"]');
                            input.value = '50';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input[type="range"]');
                            input.value = '75';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input[type="range"]');
                            input.value = '100';
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                          }}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          100%
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex items-center justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 sm:px-5 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="task-form"
                  disabled={!isFormValid()}
                  className="px-5 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Member Management Modal */}
      <TeamMemberModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onAddMember={addTeamMember}
        onRemoveMember={removeTeamMember}
        teamMembers={teamMembers}
      />

      {/* Enhanced Bulk Actions Bar */}
      {selectedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-3 flex items-center gap-4 z-40"
        >
          <span className="text-sm font-medium text-gray-700">
            {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('completed')}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Complete
            </button>
            <button
              onClick={() => handleBulkStatusChange('in_progress')}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              In Progress
            </button>
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Assign
            </button>
            <button
              onClick={() => handleBulkDelete()}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
            <button
              onClick={() => setSelectedTasks([])}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Assignment Modal */}
      <AnimatePresence>
        {showBulkAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Tasks to Team Members
                </h3>
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No team members available</p>
                    <button
                      onClick={() => {
                        setShowBulkAssignModal(false);
                        setShowTeamModal(true);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Add team members
                    </button>
                  </div>
                ) : (
                  teamMembers.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={bulkAssignMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkAssignMembers([...bulkAssignMembers, member.id]);
                          } else {
                            setBulkAssignMembers(bulkAssignMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar || member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role || member.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setBulkAssignMembers([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkAssign(bulkAssignMembers)}
                  disabled={bulkAssignMembers.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Assign to {bulkAssignMembers.length} member{bulkAssignMembers.length !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// TaskCard Component for Kanban View
const TaskCard = ({ 
  task, 
  onDragStart, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onStartTimer, 
  onStopTimer, 
  isTimerActive, 
  teamMembers,
  onToggleSubtask,
  onAddComment,
  onProgressUpdate,
  onAssignTask,
  onDuplicate,
  onArchive
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && getDaysUntilDue(dueDate) < 0;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on_hold': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'development': return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'design': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'marketing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'research': return <Search className="w-4 h-4 text-orange-600" />;
      case 'testing': return <Target className="w-4 h-4 text-red-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeSpent = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const overdue = isOverdue(task.dueDate);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(task.category)}
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div className="relative group">
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[160px]">
                <button
                  onClick={() => onEdit(task)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Task
                </button>
                <button
                  onClick={() => onDuplicate && onDuplicate(task.id)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => onArchive && onArchive(task.id)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Archive
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => onDelete(task.id)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Priority and Status */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>

        {/* Enhanced Progress Bar with Quick Update */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative group">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.progress)}`}
              style={{ width: `${task.progress}%` }}
            />
            {/* Quick Progress Buttons */}
            <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {[25, 50, 75, 100].map(value => (
                <button
                  key={value}
                  onClick={() => onProgressUpdate && onProgressUpdate(task.id, value)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    task.progress >= value 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={`Set to ${value}%`}
                >
                  {value}%
                </button>
              ))}
          </div>
          </div>
          {/* Progress Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={task.progress || 0}
            onChange={(e) => onProgressUpdate && onProgressUpdate(task.id, parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                ${task.progress >= 80 ? '#10b981' : task.progress >= 50 ? '#3b82f6' : task.progress >= 25 ? '#f59e0b' : '#ef4444'} 0%, 
                ${task.progress >= 80 ? '#10b981' : task.progress >= 50 ? '#3b82f6' : task.progress >= 25 ? '#f59e0b' : '#ef4444'} ${task.progress}%, 
                #e5e7eb ${task.progress}%, 
                #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Enhanced Assignees with Quick Assignment */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {task.assigneeNames?.slice(0, 3).map((name, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={name}
              >
                {name.charAt(0)}
              </div>
            ))}
            {task.assigneeNames?.length > 3 && (
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                +{task.assigneeNames.length - 3}
              </div>
            )}
            {(!task.assigneeNames || task.assigneeNames.length === 0) && (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
          </div>
          <button
            onClick={() => {
              // Quick assign modal - simplified version
              const memberIds = teamMembers.length > 0 ? [teamMembers[0].id] : [];
              if (memberIds.length > 0 && onAssignTask) {
                onAssignTask(task.id, memberIds);
              }
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Quick Assign"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={overdue ? 'text-red-600 font-medium' : daysUntilDue <= 1 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
            {overdue ? 'Overdue' : daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
          </span>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTimeSpent(task.timeSpent)} / {task.estimatedHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            {isTimerActive ? (
              <button
                onClick={() => onStopTimer(task.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onStartTimer(task.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-gray-200"
            >
              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700">Subtasks</h5>
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleSubtask(task.id, subtask.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          subtask.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {subtask.completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments */}
              {task.comments && task.comments.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-700">Recent Comments</h5>
                  {task.comments.slice(-2).map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{comment.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      addComment(task.id, newComment.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newComment.trim()) {
                      onAddComment(task.id, newComment.trim());
                      setNewComment('');
                    }
                  }}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// TaskRow Component for List View
const TaskRow = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onStartTimer, 
  onStopTimer, 
  isTimerActive, 
  teamMembers 
}) => {
  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && getDaysUntilDue(dueDate) < 0;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on_hold': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'development': return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'design': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'marketing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'research': return <Search className="w-4 h-4 text-orange-600" />;
      case 'testing': return <Target className="w-4 h-4 text-red-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {getCategoryIcon(task.category)}
          <div>
            <div className="font-medium text-gray-900">{task.title}</div>
            <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </td>
       <td className="px-6 py-4">
         <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
           {task.priority}
         </span>
       </td>
       <td className="px-6 py-4">
         <div className="flex -space-x-2">
           {task.assigneeNames?.slice(0, 3).map((name, index) => (
             <div
               key={index}
               className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white"
               title={name}
             >
               {name.charAt(0)}
             </div>
           ))}
           {task.assigneeNames?.length > 3 && (
             <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white">
               +{task.assigneeNames.length - 3}
             </div>
           )}
         </div>
       </td>
       <td className="px-6 py-4">
         <div className="flex items-center gap-2">
           <div className="w-16 bg-gray-200 rounded-full h-2">
             <div
               className={`h-2 rounded-full ${getProgressColor(task.progress)}`}
               style={{ width: `${task.progress}%` }}
             />
           </div>
           <span className="text-sm text-gray-600">{task.progress}%</span>
         </div>
       </td>
       <td className="px-6 py-4">
         <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : daysUntilDue <= 1 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
           {new Date(task.dueDate).toLocaleDateString()}
         </span>
       </td>
       <td className="px-6 py-4">
         <div className="flex items-center gap-2">
           {isTimerActive ? (
             <button
               onClick={() => onStopTimer(task.id)}
               className="p-1 text-red-600 hover:bg-red-50 rounded"
             >
               <Pause className="w-4 h-4" />
             </button>
           ) : (
             <button
               onClick={() => onStartTimer(task.id)}
               className="p-1 text-green-600 hover:bg-green-50 rounded"
             >
               <Play className="w-4 h-4" />
             </button>
           )}
           <button
             onClick={() => onEdit(task)}
             className="p-1 text-blue-600 hover:bg-blue-50 rounded"
           >
             <Edit className="w-4 h-4" />
           </button>
           <button
             onClick={() => onDelete(task.id)}
             className="p-1 text-red-600 hover:bg-red-50 rounded"
           >
             <Trash2 className="w-4 h-4" />
           </button>
         </div>
       </td>
     </tr>
   );
 };