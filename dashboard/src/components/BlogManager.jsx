import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function BlogManager({ showCreateForm = false }) {
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
  const tabList = [
    { key: 'details', label: 'Details', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
    ) },
    { key: 'content', label: 'Content', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3" /></svg>
    ) },
    { key: 'meta', label: 'Meta', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M4 11h16" /></svg>
    ) },
  ];
  const tabRefs = useRef([]);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const idx = tabList.findIndex(t => t.key === activeTab);
        if (e.key === 'ArrowLeft') {
          setActiveTab(tabList[(idx + tabList.length - 1) % tabList.length].key);
        } else if (e.key === 'ArrowRight') {
          setActiveTab(tabList[(idx + 1) % tabList.length].key);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabList]);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Web Development',
    tags: '',
    featured_image: '',
    status: 'draft'
  });

  const categories = [
    'Web Development',
    'React',
    'SEO',
    'UI/UX',
    'Performance',
    'Backend',
    'Mobile'
  ];

  // Add filter buttons for status
  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
    { label: 'Deleted', value: 'deleted' },
  ];

  // Load posts
  useEffect(() => {
    loadPosts();
  }, [filterStatus]);

  const loadPosts = async () => {
    try {
      const status = filterStatus === 'all' ? null : filterStatus;
      const response = await apiService.getPosts(1, 100, null, status);
      if (response.success) {
        setPosts(response.data.posts);
      } else {
        console.error('Failed to load posts:', response.message);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return '';
    
    try {
      setUploadProgress(0);
      const response = await apiService.uploadImage(file);
      if (response.success) {
        setUploadProgress(100);
        return response.data.url;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('BlogManager: Starting form submission...');
      console.log('BlogManager: Form data:', formData);
      console.log('BlogManager: Current user:', currentUser);

      let imageUrl = formData.featured_image;
      
      // Upload new image if selected
      if (imageUpload) {
        console.log('BlogManager: Uploading image...');
        imageUrl = await handleImageUpload(imageUpload);
        console.log('BlogManager: Image uploaded:', imageUrl);
      }

      const postData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured_image: imageUrl,
        status: formData.status,
        author_name: currentUser?.displayName || 'Admin User',
        readTime: Math.ceil(formData.content.split(' ').length / 200) + ' min read'
      };

      console.log('BlogManager: Prepared post data:', postData);

      let response;
      if (editingPost) {
        // Update existing post
        console.log('BlogManager: Updating existing post with ID:', editingPost.id);
        response = await apiService.updatePost(editingPost.id, postData);
      } else {
        // Create new post
        console.log('BlogManager: Creating new post...');
        response = await apiService.createPost(postData);
      }

      console.log('BlogManager: API response:', response);

      if (response.success) {
        console.log('BlogManager: Post saved successfully!');
        // Reset form and reload posts
        resetForm();
        await loadPosts();
        setShowForm(false);
      } else {
        console.error('BlogManager: API returned error:', response.message);
        throw new Error(response.message || 'Failed to save post');
      }
    } catch (error) {
      console.error('BlogManager: Error saving post:', error);
      alert('Error saving post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (post) => {
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
  };

  // Handle delete
  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const response = await apiService.deletePost(postId);
        if (response.success) {
          await loadPosts();
        } else {
          throw new Error(response.message || 'Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
      }
    }
  };

  // Handle publish/unpublish
  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (window.confirm(`Are you sure you want to ${action} this post?`)) {
      try {
        const response = await apiService.updatePost(post.id, {
          ...post,
          status: newStatus
        });
        if (response.success) {
          await loadPosts();
        } else {
          throw new Error(response.message || `Failed to ${action} post`);
        }
      } catch (error) {
        console.error(`Error ${action}ing post:`, error);
        alert(`Error ${action}ing post. Please try again.`);
      }
    }
  };

  // Restore a deleted post
  const handleRestore = async (postId) => {
    if (window.confirm('Are you sure you want to restore this post? This will move it back to Drafts.')) {
      try {
        const response = await apiService.updatePost(postId, { status: 'draft' });
        if (response.success) {
          await loadPosts();
        } else {
          throw new Error(response.message || 'Failed to restore post');
        }
      } catch (error) {
        alert('Error restoring post. Please try again.');
      }
    }
  };

  // Permanently delete a post
  const handlePermanentDelete = async (postId) => {
    if (window.confirm('This will permanently delete the post and it cannot be recovered. Are you absolutely sure?')) {
      try {
        const response = await apiService.permanentDeletePost(postId);
        if (response.success) {
          await loadPosts();
        } else {
          throw new Error(response.message || 'Failed to permanently delete post');
        }
      } catch (error) {
        alert('Error permanently deleting post. Please try again.');
      }
    }
  };

  // Reset form
  const resetForm = () => {
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
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
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
  };

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
            <ReactQuill theme="snow" value={formData.content} onChange={content => setFormData({...formData, content})} modules={{ toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['blockquote', 'code-block'], ['link', 'image'], [{ 'align': [] }], ['clean']] }} formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'code-block', 'link', 'image', 'align']} className="quill-editor-custom w-full text-lg" style={{height: '100%', minHeight: '60vh', fontSize: '1.2rem', background: 'white', borderRadius: '1.2rem'}} />
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
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
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
                    <svg className="w-8 h-8 text-blue-400 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" /></svg>
                    Post Details
                  </h4>
                </div>
                <div className="border-b border-blue-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y md:divide-y-0 px-8 pb-8">
                  {/* Title */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6 4 4 6-6" /></svg>
                      Title *
                    </label>
                    <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:border-2 focus:bg-blue-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter post title" />
                  </div>
                  {/* Category */}
                  <div className="py-4 md:pl-6 flex flex-col justify-center md:border-l md:border-blue-50">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" /></svg>
                      Category *
                    </label>
                    <div className="relative w-full flex items-center">
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:border-2 focus:bg-purple-50 bg-white hover:shadow transition-all duration-200 appearance-none shadow-sm hover:border-purple-400 outline-none">
                        {categories.map(category => (<option key={category} value={category}>{category}</option>))}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-0 bottom-0 my-auto flex items-center h-10">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                      Status *
                    </label>
                    <div className="relative w-full flex items-center">
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:border-2 focus:bg-green-50 bg-white hover:shadow transition-all duration-200 appearance-none shadow-sm hover:border-green-400 outline-none">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 top-0 bottom-0 my-auto flex items-center h-10">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="py-4 md:pl-6 flex flex-col justify-center md:border-l md:border-blue-50">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
                      Tags
                    </label>
                    <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 focus:border-2 focus:bg-pink-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter tags separated by commas (e.g., React, JavaScript, Web Development)" />
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="mb-6 rounded-3xl border border-purple-100/60 shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-200 hover:shadow-purple-200 hover:ring-2 hover:ring-purple-200 hover:scale-[1.01]">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-purple-900 tracking-tight flex items-center gap-3">
                    <svg className="w-8 h-8 text-purple-400 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" /></svg>
                    Content
                  </h4>
                </div>
                <div className="border-b border-purple-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y md:divide-y-0 md:divide-x divide-purple-50 px-8 pb-8">
                  {/* Content */}
                  <div className="py-4 md:pr-6 flex flex-col justify-center md:col-span-2">
                    <div className="flex items-center justify-between w-full mb-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" /></svg>
                        Content *
                      </label>
                      <button type="button" onClick={() => setIsFullScreen(!isFullScreen)} className="ml-2 px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 focus:outline-none">Full Screen</button>
                    </div>
                    {!isFullScreen && (
                      <div className="bg-white rounded-2xl shadow-2xl border border-purple-200 p-0 w-full" style={{minHeight: '180px', height: '180px', borderRadius: '1rem'}}>
                        <ReactQuill theme="snow" value={formData.content} onChange={content => setFormData({...formData, content})} modules={{ toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['blockquote', 'code-block'], ['link', 'image'], [{ 'align': [] }], ['clean']] }} formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'code-block', 'link', 'image', 'align']} className="quill-editor-custom w-full" style={{minHeight: '180px', height: '180px', background: 'white', borderRadius: '1rem'}} />
                      </div>
                    )}
                  </div>
                  {/* Excerpt */}
                  <div className="py-10 md:pl-6 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8" /></svg>
                      Excerpt *
                    </label>
                    <textarea required rows={3} value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 focus:border-2 focus:bg-pink-50 bg-white hover:shadow transition-all duration-200 text-base outline-none" placeholder="Enter a brief summary of the post (this will appear in the blog listing)" />
                  </div>
                </div>
              </div>
            )}

            {/* Meta Tab */}
            {activeTab === 'meta' && (
              <div className="mb-6 rounded-3xl border border-pink-100/60 shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-200 hover:shadow-pink-200 hover:ring-2 hover:ring-pink-200 hover:scale-[1.01]">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold text-pink-900 tracking-tight flex items-center gap-3">
                    <svg className="w-8 h-8 text-pink-400 drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" /></svg>
                    Meta
                  </h4>
                </div>
                <div className="border-b border-pink-100/60 mx-8 mb-2"></div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-0 px-8 pb-8">
                  {/* Image Upload */}
                  <div className="py-4 flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8" /></svg>
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
                          onClick={() => setFormData({...formData, featured_image: ''})}
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
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto">Cancel</button>
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
            <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
              {/* ...existing post rendering... */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}