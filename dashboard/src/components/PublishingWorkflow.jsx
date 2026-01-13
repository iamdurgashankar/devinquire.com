import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Send, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Lock, 
  Archive,
  Trash2,
  RefreshCw,
  Settings,
  Users,
  Tag,
  FileText,
  Image,
  Link
} from 'lucide-react';
import enhancedApiService from '../services/enhancedApiService';
import { useEnhancedAuth } from '../contexts/EnhancedAuthContext';

const PublishingWorkflow = ({ 
  post, 
  onStatusChange, 
  onSchedule, 
  onSave, 
  isLoading = false,
  className = '' 
}) => {
  const { blogPermissions, isAdmin } = useEnhancedAuth();
  const [workflowState, setWorkflowState] = useState('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [publishingOptions, setPublishingOptions] = useState({
    notifySubscribers: true,
    socialMediaShare: false,
    seoOptimization: true,
    generateExcerpt: true
  });
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Status definitions with enhanced metadata
  const statusDefinitions = useMemo(() => ({
    draft: {
      label: 'Draft',
      icon: FileText,
      color: 'bg-gray-100 text-gray-700',
      description: 'Work in progress, not visible to public',
      canTransitionTo: ['review', 'published', 'archived'],
      permissions: ['create', 'edit']
    },
    review: {
      label: 'Under Review',
      icon: Eye,
      color: 'bg-yellow-100 text-yellow-700',
      description: 'Pending review and approval',
      canTransitionTo: ['draft', 'published', 'rejected'],
      permissions: ['edit', 'review']
    },
    scheduled: {
      label: 'Scheduled',
      icon: Clock,
      color: 'bg-blue-100 text-blue-700',
      description: 'Scheduled for future publication',
      canTransitionTo: ['draft', 'published'],
      permissions: ['edit', 'publish']
    },
    published: {
      label: 'Published',
      icon: Globe,
      color: 'bg-green-100 text-green-700',
      description: 'Live and visible to public',
      canTransitionTo: ['draft', 'archived'],
      permissions: ['publish']
    },
    archived: {
      label: 'Archived',
      icon: Archive,
      color: 'bg-purple-100 text-purple-700',
      description: 'Archived, not visible to public',
      canTransitionTo: ['draft', 'published'],
      permissions: ['archive']
    },
    rejected: {
      label: 'Rejected',
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700',
      description: 'Rejected during review process',
      canTransitionTo: ['draft'],
      permissions: ['review']
    }
  }), []);

  // Initialize workflow state from post
  useEffect(() => {
    if (post) {
      setWorkflowState(post.status || 'draft');
      if (post.scheduled_at) {
        const scheduledDateTime = new Date(post.scheduled_at);
        setScheduledDate(scheduledDateTime.toISOString().split('T')[0]);
        setScheduledTime(scheduledDateTime.toTimeString().slice(0, 5));
      }
      loadWorkflowHistory();
    }
  }, [post]);

  // Load workflow history
  const loadWorkflowHistory = useCallback(async () => {
    if (!post?.id) return;
    
    try {
      const history = await enhancedApiService.getPostHistory(post.id);
      setWorkflowHistory(history || []);
    } catch (error) {
      console.error('Failed to load workflow history:', error);
    }
  }, [post?.id]);

  // Validate post for publishing
  const validatePost = useCallback(() => {
    const results = {
      title: {
        valid: post?.title?.trim()?.length >= 3,
        message: post?.title?.trim()?.length >= 3 ? 'Title looks good' : 'Title must be at least 3 characters',
        severity: post?.title?.trim()?.length >= 3 ? 'success' : 'error'
      },
      excerpt: {
        valid: post?.excerpt?.trim()?.length >= 10,
        message: post?.excerpt?.trim()?.length >= 10 ? 'Excerpt is adequate' : 'Excerpt should be at least 10 characters',
        severity: post?.excerpt?.trim()?.length >= 10 ? 'success' : 'warning'
      },
      content: {
        valid: post?.content?.trim()?.length >= 100,
        message: post?.content?.trim()?.length >= 100 ? 'Content length is good' : 'Content should be at least 100 characters',
        severity: post?.content?.trim()?.length >= 100 ? 'success' : 'error'
      },
      category: {
        valid: !!post?.category?.trim(),
        message: post?.category?.trim() ? 'Category is set' : 'Category is required',
        severity: post?.category?.trim() ? 'success' : 'warning'
      },
      featuredImage: {
        valid: !!post?.featured_image,
        message: post?.featured_image ? 'Featured image is set' : 'Featured image recommended for better engagement',
        severity: post?.featured_image ? 'success' : 'info'
      },
      seo: {
        valid: post?.title?.length <= 60 && post?.excerpt?.length <= 160,
        message: post?.title?.length <= 60 && post?.excerpt?.length <= 160 
          ? 'SEO optimization looks good' 
          : 'Title should be ≤60 chars, excerpt ≤160 chars for better SEO',
        severity: post?.title?.length <= 60 && post?.excerpt?.length <= 160 ? 'success' : 'warning'
      }
    };
    
    setValidationResults(results);
    return results;
  }, [post]);

  // Check if user can perform action
  const canPerformAction = useCallback((action) => {
    if (isAdmin) return true;
    
    const requiredPermissions = statusDefinitions[workflowState]?.permissions || [];
    return requiredPermissions.some(permission => blogPermissions?.[permission]);
  }, [isAdmin, blogPermissions, workflowState, statusDefinitions]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus) => {
    if (!canPerformAction(newStatus)) {
      alert('You do not have permission to perform this action');
      return;
    }

    // Validate before publishing
    if (newStatus === 'published') {
      const validation = validatePost();
      const criticalErrors = Object.values(validation).filter(v => v.severity === 'error' && !v.valid);
      
      if (criticalErrors.length > 0) {
        const errorMessages = criticalErrors.map(e => e.message).join('\n');
        alert(`Cannot publish due to validation errors:\n\n${errorMessages}`);
        return;
      }
    }

    try {
      const updateData = {
        status: newStatus,
        last_modified: new Date().toISOString(),
        workflow_history: [
          ...workflowHistory,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            user: 'Current User', // Replace with actual user
            action: `Changed status from ${workflowState} to ${newStatus}`
          }
        ]
      };

      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      if (newStatus === 'scheduled' && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        updateData.scheduled_at = scheduledDateTime.toISOString();
      }

      await onStatusChange(post.id, newStatus, updateData);
      setWorkflowState(newStatus);
      loadWorkflowHistory();
      
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change status. Please try again.');
    }
  }, [canPerformAction, validatePost, workflowHistory, workflowState, scheduledDate, scheduledTime, onStatusChange, loadWorkflowHistory]);

  // Handle scheduling
  const handleSchedulePublish = useCallback(async () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time for scheduling');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      alert('Scheduled time must be in the future');
      return;
    }

    await handleStatusChange('scheduled');
    setShowScheduler(false);
  }, [scheduledDate, scheduledTime, handleStatusChange]);

  // Get available actions based on current status
  const getAvailableActions = useCallback(() => {
    const currentStatus = statusDefinitions[workflowState];
    if (!currentStatus) return [];

    return currentStatus.canTransitionTo
      .filter(status => canPerformAction(status))
      .map(status => ({
        status,
        ...statusDefinitions[status]
      }));
  }, [workflowState, statusDefinitions, canPerformAction]);

  // Render validation results
  const renderValidationResults = () => {
    const results = validatePost();
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Publishing Checklist</h4>
        {Object.entries(results).map(([key, result]) => {
          const Icon = result.severity === 'error' ? AlertCircle : 
                     result.severity === 'warning' ? AlertCircle : 
                     CheckCircle;
          
          const colorClass = result.severity === 'error' ? 'text-red-600' :
                           result.severity === 'warning' ? 'text-yellow-600' :
                           result.severity === 'success' ? 'text-green-600' :
                           'text-blue-600';
          
          return (
            <div key={key} className={`flex items-center space-x-2 text-sm ${colorClass}`}>
              <Icon className="w-4 h-4" />
              <span>{result.message}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render workflow history
  const renderWorkflowHistory = () => {
    if (!workflowHistory.length) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Workflow History</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {workflowHistory.slice(-5).reverse().map((entry, index) => (
            <div key={index} className="text-xs text-gray-600 flex justify-between">
              <span>{entry.action}</span>
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentStatus = statusDefinitions[workflowState];
  const StatusIcon = currentStatus?.icon || FileText;
  const availableActions = getAvailableActions();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Current Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${currentStatus?.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{currentStatus?.label}</span>
          </div>
          <span className="text-sm text-gray-500">{currentStatus?.description}</span>
        </div>
        
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableActions.map((action) => {
          const ActionIcon = action.icon;
          
          return (
            <button
              key={action.status}
              onClick={() => {
                if (action.status === 'scheduled') {
                  setShowScheduler(true);
                } else {
                  handleStatusChange(action.status);
                }
              }}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                action.status === 'published' 
                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                  : action.status === 'draft'
                  ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ActionIcon className="w-4 h-4" />
              <span>
                {action.status === 'published' ? 'Publish Now' :
                 action.status === 'scheduled' ? 'Schedule' :
                 action.status === 'draft' ? 'Save as Draft' :
                 action.label}
              </span>
            </button>
          );
        })}
        
        {/* Save Draft Button */}
        <button
          onClick={(e) => onSave(e)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Schedule Publication</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSchedulePublish}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Clock className="w-4 h-4" />
              <span>Schedule</span>
            </button>
            <button
              onClick={() => setShowScheduler(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Publishing Options */}
      {(workflowState === 'draft' || workflowState === 'review') && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Publishing Options</h4>
          <div className="space-y-2">
            {Object.entries(publishingOptions).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPublishingOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {key === 'notifySubscribers' ? 'Notify subscribers' :
                   key === 'socialMediaShare' ? 'Share on social media' :
                   key === 'seoOptimization' ? 'Apply SEO optimization' :
                   key === 'generateExcerpt' ? 'Auto-generate excerpt' :
                   key}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Validation Results */}
      <div className="mb-4">
        {renderValidationResults()}
      </div>

      {/* Workflow History */}
      {renderWorkflowHistory()}
    </div>
  );
};

export default PublishingWorkflow;