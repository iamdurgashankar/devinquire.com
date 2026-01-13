/**
 * Enhanced Blog Post Editor Component
 * Comprehensive blog post creation and editing with advanced features
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Save, X, Eye, Settings, Image, Link, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote,
  Code, Undo, Redo, Calendar, Tag, Folder, Globe, Lock, Users,
  Star, Clock, CheckCircle, AlertCircle, Info, Loader, History,
  Share2, Copy, ExternalLink, Maximize2, Minimize2, ChevronDown,
  ChevronUp, Search, Filter, BarChart3, Zap, Shield, PenTool, FileText
} from 'lucide-react';
import BlockEditor from './BlockEditor';

const EnhancedBlogEditor = ({
  post = null,
  onSave,
  onCancel,
  onPreview,
  isFullScreen = false,
  onToggleFullScreen,
  userPermissions = [],
  validationService,
  versionControlService,
  authService
}) => {
  // Editor state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Web Development',
    tags: '',
    featured_image: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    socialTitle: '',
    socialDescription: '',
    socialImage: '',
    publishDate: '',
    scheduledDate: '',
    priority: 'normal',
    visibility: 'public',
    password: '',
    allowComments: true,
    allowSharing: true,
    featured: false,
    sticky: false,
    template: 'default',
    customCSS: '',
    customJS: '',
    relatedPosts: [],
    series: '',
    seriesOrder: 0,
    language: 'en',
    readingTime: 0,
    wordCount: 0,
    revisionNotes: ''
  });

  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationScore, setValidationScore] = useState(0);
  const [seoScore, setSeoScore] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const [showSEOAnalyzer, setShowSEOAnalyzer] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // Refs
  const editorRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const validationTimeoutRef = useRef(null);

  // Categories and options
  const categories = useMemo(() => [
    'Web Development', 'Mobile Development', 'Data Science', 'AI/ML',
    'DevOps', 'UI/UX Design', 'Backend Development', 'Frontend Development',
    'Full Stack Development', 'Technology News', 'Programming Tips',
    'Career Advice', 'Industry Insights', 'Tutorial', 'Review',
    'Opinion', 'Case Study', 'Best Practices', 'Tools & Resources', 'Open Source'
  ], []);

  const priorities = useMemo(() => [
    { value: 'low', label: 'Low Priority', color: 'text-gray-500' },
    { value: 'normal', label: 'Normal Priority', color: 'text-blue-500' },
    { value: 'high', label: 'High Priority', color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' }
  ], []);

  const visibilityOptions = useMemo(() => [
    { value: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only visible to you' },
    { value: 'password', label: 'Password Protected', icon: Shield, description: 'Requires password' },
    { value: 'members', label: 'Members Only', icon: Users, description: 'Only for registered users' }
  ], []);

  const templates = useMemo(() => [
    { value: 'default', label: 'Default Template' },
    { value: 'minimal', label: 'Minimal Template' },
    { value: 'featured', label: 'Featured Post Template' },
    { value: 'tutorial', label: 'Tutorial Template' },
    { value: 'review', label: 'Review Template' },
    { value: 'case-study', label: 'Case Study Template' }
  ], []);

  // Tab configuration
  const tabs = useMemo(() => [
    {
      key: 'details',
      label: 'Details',
      icon: Info,
      description: 'Basic post information and metadata'
    },
    {
      key: 'content',
      label: 'Content',
      icon: PenTool,
      description: 'Write and edit your post content'
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Publishing and visibility options'
    },
    {
      key: 'seo',
      label: 'SEO & Social',
      icon: BarChart3,
      description: 'Search engine and social media optimization'
    },
    {
      key: 'advanced',
      label: 'Advanced',
      icon: Zap,
      description: 'Developer options and revision notes'
    },
    {
      key: 'preview',
      label: 'Preview',
      icon: Eye,
      description: 'Preview your post'
    }
  ], []);

  // Initialize form data from post
  useEffect(() => {
    if (post) {
      setFormData({
        ...formData,
        ...post,
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
        publishDate: post.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : '',
        scheduledDate: post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : ''
      });
      setHasUnsavedChanges(false);
    }
  }, [post]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && post?.id) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          setAutoSaving(true);
          await handleAutoSave();
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setAutoSaving(false);
        }
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, formData]);

  // Real-time validation
  useEffect(() => {
    if (validationService && hasUnsavedChanges) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      validationTimeoutRef.current = setTimeout(async () => {
        try {
          const validation = await validationService.validatePost(formData);
          setValidationErrors(validation.errors || {});
          setValidationScore(validation.score || 0);
          setSeoScore(validation.seoScore || 0);
        } catch (error) {
          console.error('Validation failed:', error);
        }
      }, 1000); // Validate after 1 second of inactivity
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [formData, validationService, hasUnsavedChanges]);

  // Calculate word count and reading time
  useEffect(() => {
    const text = formData.content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    const time = Math.ceil(count / 200); // Assuming 200 words per minute

    setWordCount(count);
    setReadingTime(time);

    // Update form data
    if (formData.wordCount !== count || formData.readingTime !== time) {
      setFormData(prev => ({
        ...prev,
        wordCount: count,
        readingTime: time
      }));
    }
  }, [formData.content]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Handle form changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle content change
  const handleContentChange = useCallback((content) => {
    handleInputChange('content', content);
  }, [handleInputChange]);

  // Handle auto-save
  const handleAutoSave = useCallback(async () => {
    if (post?.id && versionControlService) {
      try {
        await versionControlService.saveRevision(post.id, formData, {
          type: 'auto-save',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        throw error;
      }
    }
  }, [post, formData, versionControlService]);

  // Handle save
  const handleSave = useCallback(async (status = 'draft') => {
    try {
      const postData = {
        ...formData,
        status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        updatedAt: new Date().toISOString()
      };

      if (status === 'published' && !postData.publishDate) {
        postData.publishDate = new Date().toISOString();
      }

      await onSave(postData);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }, [formData, onSave]);

  // Handle version history
  const loadVersionHistory = useCallback(async () => {
    if (post?.id && versionControlService) {
      try {
        const history = await versionControlService.getRevisionHistory(post.id);
        setVersionHistory(history);
        setShowVersionHistory(true);
      } catch (error) {
        console.error('Failed to load version history:', error);
      }
    }
  }, [post, versionControlService]);

  // Handle version restore
  const handleVersionRestore = useCallback(async (version) => {
    if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      setFormData(version.data);
      setSelectedVersion(version);
      setShowVersionHistory(false);
      setHasUnsavedChanges(true);
    }
  }, []);

  // Render validation status
  const renderValidationStatus = () => {
    const errorCount = Object.keys(validationErrors).length;
    const scoreColor = validationScore >= 80 ? 'text-green-500' :
      validationScore >= 60 ? 'text-yellow-500' : 'text-red-500';

    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className={`flex items-center space-x-1 ${scoreColor}`}>
          <CheckCircle className="w-4 h-4" />
          <span>Quality: {validationScore}%</span>
        </div>
        <div className={`flex items-center space-x-1 ${seoScore >= 80 ? 'text-green-500' : seoScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
          <BarChart3 className="w-4 h-4" />
          <span>SEO: {seoScore}%</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center space-x-1 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>{errorCount} issues</span>
          </div>
        )}
      </div>
    );
  };

  // Render editor header
  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {post ? 'Edit Post' : 'Create New Post'}
        </h2>
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-2 text-sm text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span>Unsaved changes</span>
          </div>
        )}
        {autoSaving && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Auto-saving...</span>
          </div>
        )}
        {lastSaved && (
          <div className="text-sm text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {renderValidationStatus()}

        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>{wordCount} words</span>
        </div>

        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{readingTime} min read</span>
        </div>

        {versionControlService && (
          <button
            onClick={loadVersionHistory}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Version History"
          >
            <History className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onToggleFullScreen}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onCancel}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close Editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Render tab navigation
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${isActive
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            title={tab.description}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  // Render details tab
  const renderDetailsTab = () => (
    <div className="p-8 space-y-8 bg-surface-50/30">
      {/* Primary Information */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-surface-100 dark:border-surface-800 pb-4">
          <FileText className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-surface-900 dark:text-surface-100">Primary Information</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
              Post Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-lg font-bold outline-none"
              placeholder="A compelling title for your blog post"
            />
            {validationErrors.title && (
              <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                <AlertCircle size={10} /> {validationErrors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                URL Slug
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm pr-24 outline-none"
                  placeholder="url-friendly-slug"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-300 group-hover:text-brand-500 transition-colors">
                  /blog/{formData.slug || '...'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm appearance-none outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Meta Content */}
      <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-surface-100 dark:border-surface-800 pb-4">
          <Tag className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-surface-900 dark:text-surface-100">Metadata & Summary</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm resize-none outline-none"
              placeholder="A brief summary that appears in social shares and search results..."
            />
            <div className="flex justify-between mt-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-400 px-1">
              <span>Short and engaging</span>
              <span className={formData.excerpt.length > 160 ? 'text-red-500' : ''}>{formData.excerpt.length}/160</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm outline-none"
              placeholder="tag1, tag2, tag3 (comma separated)"
            />
          </div>
        </div>
      </section>
    </div>
  );

  // Render content tab
  const renderContentTab = () => (
    <div className="p-8">
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8 border-b border-surface-100 dark:border-surface-800 pb-4">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-100">Content Editor</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-100 dark:border-surface-700">
              <FileText size={12} className="text-surface-400" />
              <span className="text-[10px] font-bold text-surface-500">{wordCount} WORDS</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-100 dark:border-surface-700">
              <Clock size={12} className="text-surface-400" />
              <span className="text-[10px] font-bold text-surface-500">{readingTime} MIN READ</span>
            </div>
          </div>
        </div>

        <BlockEditor
          content={formData.content}
          onChange={(newContent) => handleInputChange('content', newContent)}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );

  // Render settings tab
  const renderSettingsTab = () => (
    <div className="p-8 space-y-8 bg-surface-50/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visibility & Status */}
        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-surface-100 dark:border-surface-800 pb-4">
            <Globe className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-100">Visibility & Priority</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                Post Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleInputChange('visibility', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.visibility === 'password' && (
              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1 text-red-500">
                  Access Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-red-500/20 focus:border-red-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-red-500/5 transition-all text-sm"
                  placeholder="Enter secure password..."
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Media & Options */}
        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-surface-100 dark:border-surface-800 pb-4">
            <Image className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-100">Media & Interactions</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                Featured Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
                  placeholder="Enter image URL..."
                />
                <button
                  onClick={() => setShowImageManager(true)}
                  className="p-2.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-xl border border-brand-100 dark:border-brand-900/30 hover:bg-brand-100 transition-colors"
                >
                  <Image size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-brand-500/10 hover:bg-brand-50/10 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-4 h-4 rounded-md border-surface-300 text-brand-600 focus:ring-brand-500 transition-all"
                />
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Featured Post</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-brand-500/10 hover:bg-brand-50/10 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={formData.sticky}
                  onChange={(e) => handleInputChange('sticky', e.target.checked)}
                  className="w-4 h-4 rounded-md border-surface-300 text-brand-600 focus:ring-brand-500 transition-all"
                />
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Sticky Post</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-brand-500/10 hover:bg-brand-50/10 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                  className="w-4 h-4 rounded-md border-surface-300 text-brand-600 focus:ring-brand-500 transition-all"
                />
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Allow Comments</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-brand-500/10 hover:bg-brand-50/10 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={formData.allowSharing}
                  onChange={(e) => handleInputChange('allowSharing', e.target.checked)}
                  className="w-4 h-4 rounded-md border-surface-300 text-brand-600 focus:ring-brand-500 transition-all"
                />
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Allow Sharing</span>
              </label>
            </div>
          </div>
        </section>

        {/* Scheduling */}
        <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-surface-100 dark:border-surface-800 pb-4">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-100">Publishing Schedule</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1">
                Immediate Publication Date
              </label>
              <input
                type="datetime-local"
                value={formData.publishDate}
                onChange={(e) => handleInputChange('publishDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-transparent focus:border-brand-500/20 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5 ml-1 text-brand-500">
                Future Scheduling Date
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border-2 border-brand-500/20 focus:border-brand-500 focus:bg-white dark:focus:bg-surface-800 focus:ring-4 focus:ring-brand-500/5 transition-all text-sm"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // Render SEO tab
  const renderSEOTab = () => (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>

        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
          </label>
          <input
            type="text"
            value={formData.metaTitle}
            onChange={(e) => handleInputChange('metaTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="SEO optimized title..."
            maxLength={60}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.metaTitle.length}/60 characters
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            value={formData.metaDescription}
            onChange={(e) => handleInputChange('metaDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="SEO meta description..."
            maxLength={160}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.metaDescription.length}/160 characters
          </p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Keywords
          </label>
          <input
            type="text"
            value={formData.metaKeywords}
            onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        {/* Canonical URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canonical URL
          </label>
          <input
            type="url"
            value={formData.canonicalUrl}
            onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/canonical-url"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Social Media</h3>

        {/* Social Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Title
          </label>
          <input
            type="text"
            value={formData.socialTitle}
            onChange={(e) => handleInputChange('socialTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Title for social media sharing..."
          />
        </div>

        {/* Social Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Description
          </label>
          <textarea
            value={formData.socialDescription}
            onChange={(e) => handleInputChange('socialDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description for social media sharing..."
          />
        </div>

        {/* Social Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Image
          </label>
          <input
            type="url"
            value={formData.socialImage}
            onChange={(e) => handleInputChange('socialImage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/social-image.jpg"
          />
          {formData.socialImage && (
            <div className="mt-2">
              <img
                src={formData.socialImage}
                alt="Social media image preview"
                className="w-32 h-20 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render advanced tab
  const renderAdvancedTab = () => (
    <div className="p-6 space-y-6">
      {/* Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template
        </label>
        <select
          value={formData.template}
          onChange={(e) => handleInputChange('template', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {templates.map((template) => (
            <option key={template.value} value={template.value}>
              {template.label}
            </option>
          ))}
        </select>
      </div>

      {/* Series */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Series
          </label>
          <input
            type="text"
            value={formData.series}
            onChange={(e) => handleInputChange('series', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Series name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Series Order
          </label>
          <input
            type="number"
            value={formData.seriesOrder}
            onChange={(e) => handleInputChange('seriesOrder', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <select
          value={formData.language}
          onChange={(e) => handleInputChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
        </select>
      </div>

      {/* Custom CSS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom CSS
        </label>
        <textarea
          value={formData.customCSS}
          onChange={(e) => handleInputChange('customCSS', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="/* Custom CSS for this post */"
        />
      </div>

      {/* Custom JavaScript */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom JavaScript
        </label>
        <textarea
          value={formData.customJS}
          onChange={(e) => handleInputChange('customJS', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="// Custom JavaScript for this post"
        />
      </div>

      {/* Revision Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Revision Notes
        </label>
        <textarea
          value={formData.revisionNotes}
          onChange={(e) => handleInputChange('revisionNotes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Notes about this revision..."
        />
      </div>
    </div>
  );

  // Render preview tab
  const renderPreviewTab = () => (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`px-3 py-1 text-sm rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Desktop
          </button>
          <button
            onClick={() => setPreviewMode('tablet')}
            className={`px-3 py-1 text-sm rounded ${previewMode === 'tablet' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Tablet
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`px-3 py-1 text-sm rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className={`border border-gray-200 rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm mx-auto' :
        previewMode === 'tablet' ? 'max-w-2xl mx-auto' : 'w-full'
        }`}>
        <div className="bg-white p-6">
          {formData.featured_image && (
            <img
              src={formData.featured_image}
              alt={formData.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {formData.title || 'Untitled Post'}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <span>{formData.author}</span>
            <span>•</span>
            <span>{readingTime} min read</span>
            <span>•</span>
            <span>{wordCount} words</span>
          </div>

          {formData.excerpt && (
            <p className="text-gray-700 mb-4 italic">
              {formData.excerpt}
            </p>
          )}

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: formData.content }}
          />

          {formData.tags && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render footer with action buttons
  const renderFooter = () => (
    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={() => handleSave('draft')}
          disabled={!formData.title || !formData.content}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>Save Draft</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>

        {userPermissions.includes('blog:posts:publish') && (
          <button
            onClick={() => handleSave('published')}
            disabled={!formData.title || !formData.content || Object.keys(validationErrors).length > 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Publish</span>
          </button>
        )}

        {formData.scheduledDate && (
          <button
            onClick={() => handleSave('scheduled')}
            disabled={!formData.title || !formData.content}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50' : 'max-w-6xl mx-auto'
      }`}>
      {renderHeader()}
      {renderTabs()}

      <div className="overflow-y-auto" style={{ maxHeight: isFullScreen ? 'calc(100vh - 140px)' : '600px' }}>
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'seo' && renderSEOTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>

      {renderFooter()}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-80">
              {versionHistory.map((version, index) => (
                <div
                  key={version.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVersionRestore(version)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Version {versionHistory.length - index}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                      {version.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {version.notes}
                        </p>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBlogEditor;