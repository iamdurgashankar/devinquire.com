import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  List, 
  Edit, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Plus, 
  ChevronDown, 
  Check, 
  Minus 
} from 'lucide-react';

const BlogManager = React.memo(function BlogManager({ showCreateForm = false }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showCreateForm);
  const [editingPost, setEditingPost] = useState(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const tabList = useMemo(() => [
    { key: 'details', label: 'Details', icon: <List className="w-5 h-5" /> },
    { key: 'content', label: 'Content', icon: <Edit className="w-5 h-5" /> },
    { key: 'meta', label: 'Meta', icon: <Calendar className="w-5 h-5" /> }
  ], []);
  const tabRefs = useRef([]);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Web Development',
    tags: '',
    featured_image: '',
    status: 'draft'
  });

  const categories = useMemo(() => [
    'Web Development',
    'Mobile Development', 
    'Data Science',
    'AI/ML',
    'DevOps',
    'UI/UX Design',
    'Backend Development',
    'Frontend Development',
    'Full Stack Development',
    'Technology News',
    'Programming Tips',
    'Career Advice',
    'Industry Insights',
    'Tutorial',
    'Review',
    'Opinion',
    'Case Study',
    'Best Practices',
    'Tools & Resources',
    'Open Source'
  ], []);

  // Add filter buttons for status
  const statusFilters = useMemo(() => [
    { value: 'all', label: 'All Posts' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Drafts' },
    { value: 'archived', label: 'Archived' },
    { value: 'deleted', label: 'Deleted' }
  ], []);

  // Load posts
  useEffect(() => {
    loadPosts();
  }, [filterStatus]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/posts');
      let filteredPosts = response.data || [];
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.status === filterStatus);
      }
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      setUploadProgress(0);
      const response = await apiService.post('/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.featured_image;
      
      // Upload image if selected
      if (imageUpload) {
        imageUrl = await handleImageUpload(imageUpload);
      }

      const postData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured_image: imageUrl,
        status: formData.status,
        author_name: currentUser?.displayName || 'Admin User'
      };

      if (editingPost) {
        await apiService.put(`/posts/${editingPost.id}`, postData);
      } else {
        await apiService.post('/posts', postData);
      }

      resetForm();
      await loadPosts();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, imageUpload, editingPost, currentUser, handleImageUpload, loadPosts]);

  // Handle edit
  const handleEdit = useCallback((post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      featured_image: post.featured_image,
      status: post.status || 'draft'
    });
    setShowForm(true);
    setActiveTab('details');
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await apiService.delete(`/posts/${postId}`);
        await loadPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
      }
    }
  }, [loadPosts]);

  // Handle publish/unpublish
  const handleToggleStatus = useCallback(async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (window.confirm(`Are you sure you want to ${action} this post?`)) {
      try {
        await apiService.put(`/posts/${post.id}`, {
          status: newStatus
        });
        await loadPosts();
      } catch (error) {
        console.error(`Error ${action}ing post:`, error);
        alert(`Error ${action}ing post. Please try again.`);
      }
    }
  }, [loadPosts]);

  // Restore a deleted post
  const handleRestore = useCallback(async (postId) => {
    if (window.confirm('Are you sure you want to restore this post? This will move it back to Drafts.')) {
      try {
        await apiService.put(`/posts/${postId}`, { status: 'draft' });
        await loadPosts();
      } catch (error) {
        console.error('Error restoring post:', error);
        alert('Error restoring post. Please try again.');
      }
    }
  }, [loadPosts]);

  // Permanently delete a post
  const handlePermanentDelete = useCallback(async (postId) => {
    if (window.confirm('This will permanently delete the post and it cannot be recovered. Are you absolutely sure?')) {
      try {
        await apiService.delete(`/posts/${postId}?permanent=true`);
        await loadPosts();
      } catch (error) {
        console.error('Error permanently deleting post:', error);
        alert('Error permanently deleting post. Please try again.');
      }
    }
  }, [loadPosts]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Web Development',
      tags: '',
      featured_image: '',
      status: 'draft'
    });
    setEditingPost(null);
    setImageUpload(null);
    setUploadProgress(0);
  }, []);

  // Get status badge color
  const getStatusBadgeColor = useCallback((status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // ReactQuill configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      ['clean']
    ]
  }), []);

  const quillFormats = useMemo(() => [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image', 'align'
  ], []);

  // Form handlers
  const handleFormDataChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleToggleForm = useCallback(() => {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  }, [showForm, resetForm]);

  const handleCancelForm = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  // Fullscreen scroll/overflow fix
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullScreen]);

  return (
    <div className="p-6">
      {/* Fullscreen Content Editor Overlay */}
      {isFullScreen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-black/70 transition-all duration-300" style={{height: '100vh', width: '100vw', padding: 0, margin: 0}}>
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 p-8 w-full max-w-4xl mx-auto my-auto flex-1 flex flex-col relative" style={{height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 12px 48px rgba(128,0,128,0.12)', transition: 'all 0.3s'}}>
            <button type="button" onClick={() => setIsFullScreen(false)} className="absolute top-4 right-4 z-[10000] text-gray-700 hover:text-red-600 bg-white bg-opacity-90 rounded-full p-2 shadow-2xl border border-gray-300 transition-colors duration-200" style={{fontSize: '1.8rem', lineHeight: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.22)'}} aria-label="Close Full Screen">&times;</button>
            <ReactQuill 
              theme="snow" 
              value={formData.content} 
              onChange={content => handleFormDataChange('content', content)} 
              modules={quillModules} 
              formats={quillFormats} 
              className="quill-editor-custom w-full text-lg" 
              style={{height: '100%', minHeight: '60vh', fontSize: '1.2rem', background: 'white', borderRadius: '1.2rem'}} 
            />
          </div>
        </div>,
        document.body
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingPost ? 'Edit Post' : 'Blog Posts'}
        </h2>
        <button
          onClick={handleToggleForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          {showForm ? 'Cancel' : 'Create New Post'}
        </button>
      </div>

      {/* Status Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 ${
              filterStatus === filter.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
            }`}
            onClick={() => setFilterStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h3>

          {/* Animated, accessible, compact tab bar */}
          <div className="flex space-x-2 mb-6 border-b border-gray-100 sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm py-1 px-1 sm:static sm:bg-transparent sm:shadow-none sm:py-0 sm:px-0">
            {tabList.map((tab, i) => (
              <button
                key={tab.key}
                ref={el => tabRefs.current[i] = el}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg font-medium focus:outline-none transition-all duration-200 transform ${activeTab === tab.key ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-sm scale-105' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 scale-100'}`}
                tabIndex={0}
                aria-selected={activeTab === tab.key}
                aria-controls={`tab-panel-${tab.key}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="mb-6 rounded-3xl border border-blue-100/60 shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-200 hover:shadow-blue-200 hover:ring-2 hover:ring-blue-200 hover:scale-[1.01]">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-400 drop-shadow" />
                    Post Details
                  </h4>
                </div>
                <div className="border-b border-blue-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y md:divide-y-0 px-8 pb-8">
                  {/* Title */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center">
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Title *
                    </label>
                    <input type="text" required value={formData.title} onChange={(e) => handleFormDataChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:border-2 focus:bg-blue-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter post title" />
                  </div>
                  {/* Category */}
                  <div className="py-4 md:pl-6 flex flex-col justify-center md:border-l md:border-blue-50">
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-purple-400" />
                      Category *
                    </label>
                    <div className="relative w-full flex items-center">
                      <select value={formData.category} onChange={(e) => handleFormDataChange('category', e.target.value)} className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:border-2 focus:bg-purple-50 bg-white hover:shadow transition-all duration-200 appearance-none shadow-sm hover:border-purple-400 outline-none">
                        {categories.map(category => (<option key={category} value={category}>{category}</option>))}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-0 bottom-0 my-auto flex items-center h-10">
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </span>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center">
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Status *
                    </label>
                    <div className="relative w-full flex items-center">
                      <select value={formData.status} onChange={(e) => handleFormDataChange('status', e.target.value)} className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:border-2 focus:bg-green-50 bg-white hover:shadow transition-all duration-200 appearance-none shadow-sm hover:border-green-400 outline-none">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 top-0 bottom-0 my-auto flex items-center h-10">
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </span>
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="py-4 md:pl-6 flex flex-col justify-center md:border-l md:border-blue-50">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <Minus className="w-5 h-5 text-pink-400" />
                      Tags
                    </label>
                    <input type="text" value={formData.tags} onChange={(e) => handleFormDataChange('tags', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 focus:border-2 focus:bg-pink-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter tags separated by commas (e.g., React, JavaScript, Web Development)" />
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="mb-6 rounded-3xl border border-purple-100/60 shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-200 hover:shadow-purple-200 hover:ring-2 hover:ring-purple-200 hover:scale-[1.01]">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-purple-900 tracking-tight flex items-center gap-3">
                    <Edit className="w-8 h-8 text-purple-400 drop-shadow" />
                    Content
                  </h4>
                </div>
                <div className="border-b border-purple-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y md:divide-y-0 md:divide-x divide-purple-50 px-8 pb-8">
                  {/* Content */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center md:col-span-2">
                    <div className="flex items-center justify-between w-full mb-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Edit className="w-5 h-5 text-purple-400" />
                        Content *
                      </label>
                      <button type="button" onClick={() => setIsFullScreen(!isFullScreen)} className="ml-2 px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 focus:outline-none">Full Screen</button>
                    </div>
                    {!isFullScreen && (
                      <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 p-0 w-full" style={{minHeight: '180px', height: '180px', borderRadius: '1rem'}}>
                        <ReactQuill 
                          theme="snow" 
                          value={formData.content} 
                          onChange={content => handleFormDataChange('content', content)} 
                          modules={quillModules} 
                          formats={quillFormats} 
                          className="quill-editor-custom w-full" 
                          style={{minHeight: '180px', height: '180px', background: 'white', borderRadius: '1rem'}} 
                        />
                      </div>
                    )}
                  </div>
                  {/* Excerpt */}
                  <div className="py-10 md:pl-6 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <Minus className="w-5 h-5 text-pink-400" />
                      Excerpt *
                    </label>
                    <textarea required rows={3} value={formData.excerpt} onChange={(e) => handleFormDataChange('excerpt', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 focus:border-2 focus:bg-pink-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter a brief summary of the post (this will appear in the blog listing)" />
                  </div>
                </div>
              </div>
            )}

            {/* Meta Tab */}
            {activeTab === 'meta' && (
              <div className="mb-6 rounded-3xl border border-pink-100/60 shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-200 hover:shadow-pink-200 hover:ring-2 hover:ring-pink-200 hover:scale-[1.01]">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-pink-900 tracking-tight flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-pink-400 drop-shadow" />
                    Meta
                  </h4>
                </div>
                <div className="border-b border-pink-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-0 px-8 pb-8">
                  {/* Image Upload */}
                  <div className="py-4 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <Minus className="w-5 h-5 text-pink-400" />
                      Featured Image
                    </label>
                    <div className="flex items-center gap-4">
                      <label htmlFor="featured-image-upload" className="inline-block px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg shadow transition-colors duration-200 cursor-pointer border border-pink-600 focus:ring-2 focus:ring-pink-300 focus:outline-none">
                        Choose File
                        <input
                          id="featured-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageUpload(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-700 text-sm truncate max-w-xs">
                        {imageUpload ? imageUpload.name : (formData.featured_image ? formData.featured_image.split('/').pop() : 'No file chosen')}
                      </span>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-pink-400 h-2 rounded-full" style={{width: `${uploadProgress}%`}}></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                    {imageUpload && (
                      <div className="mt-2 relative w-32 h-20">
                        <img src={URL.createObjectURL(imageUpload)} alt="Preview" className="w-32 h-20 object-cover rounded border border-pink-300" />
                        <button
                          type="button"
                          onClick={() => setImageUpload(null)}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 hover:bg-red-500 hover:text-white text-pink-500 rounded-full p-1 shadow border border-pink-200 transition-colors duration-150"
                          style={{fontSize: '1rem', lineHeight: 1}}
                          aria-label="Remove selected image"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                    {!imageUpload && formData.featured_image && (
                      <div className="mt-2 relative w-32 h-20">
                        <img src={formData.featured_image} alt="Current" className="w-32 h-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => handleFormDataChange('featured_image', '')}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 hover:bg-red-500 hover:text-white text-pink-500 rounded-full p-1 shadow border border-pink-200 transition-colors duration-150"
                          style={{fontSize: '1rem', lineHeight: 1}}
                          aria-label="Remove current image"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Action Bar */}
            <div className="sticky bottom-0 bg-white py-4 flex flex-col sm:flex-row justify-end items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 border-t border-gray-100 z-10 mt-8 px-2 sm:px-0">
              <button type="button" onClick={handleCancelForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto">Cancel</button>
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto">{loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading && !showForm ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? "No posts available. Create your first post!" 
                : `No ${filterStatus} posts found.`
              }
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostItem 
              key={post.id} 
              post={post} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              getStatusBadgeColor={getStatusBadgeColor}
            />
          ))
        )}
      </div>
    </div>
  );
});

// Memoized PostItem component for better performance
const PostItem = React.memo(function PostItem({ 
  post, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onRestore, 
  onPermanentDelete, 
  getStatusBadgeColor 
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Category: {post.category}</span>
                    <span>Author: {post.author_name}</span>
                    <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                    {post.read_time && <span>Read Time: {post.read_time}</span>}
                  </div>
                </div>
                {post.featured_image && (
                  <div className="ml-4 flex-shrink-0">
                    <img 
                      src={post.featured_image} 
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(post)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    Edit
                  </button>
                  
                  {/* Publish/Unpublish Button */}
                  {post.status !== 'deleted' && (
                    <button
                      onClick={() => onToggleStatus(post)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                        post.status === 'published'
                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                    >
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  )}
                  
                  {/* Delete/Restore Button */}
                  {post.status === 'deleted' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRestore(post.id)}
                        className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors duration-200 text-sm font-medium"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => onPermanentDelete(post.id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 text-sm font-medium"
                      >
                        Delete Forever
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onDelete(post.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
    </div>
   );
 });
 
 export default BlogManager;