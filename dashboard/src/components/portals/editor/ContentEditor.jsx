import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  Folder,
  Globe,
  FileText,
  AlignLeft,
  Type,
  X,
  Loader
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
  }
};

const ContentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState({
    title: '',
    body: '',
    category: '',
    tags: [],
    status: 'draft',
    featuredImage: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) {
      loadContent(id);
    }
  }, [id]);

  const loadContent = async (contentId) => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setContent({
        title: 'Sample Blog Post',
        body: 'This is the content of the blog post...',
        category: 'Technology',
        tags: ['react', 'javascript', 'web-development'],
        status: 'draft',
        featuredImage: '',
        excerpt: 'A brief excerpt of the blog post...',
        seoTitle: 'Sample Blog Post - Tech Blog',
        seoDescription: 'Learn about the latest in technology with this comprehensive guide.'
      });
      setLoading(false);
    }, 1000);
  };

  const handleSave = async (publishNow = false) => {
    setSaving(true);

    const updatedContent = {
      ...content,
      status: publishNow ? 'published' : content.status,
      updatedAt: new Date().toISOString()
    };

    // Mock save - replace with actual API call
    setTimeout(() => {
      console.log('Saving content:', updatedContent);
      setSaving(false);

      if (publishNow) {
        alert('Content published successfully!');
      } else {
        alert('Content saved as draft!');
      }
    }, 1500);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !content.tags.includes(tagInput.trim())) {
      setContent({
        ...content,
        tags: [...content.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setContent({
      ...content,
      tags: content.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full mb-4"
        />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading content...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl sticky top-4 z-10 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {id ? 'Edit Content' : 'Create New Content'}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              content.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              content.status === 'draft' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {content.status.toUpperCase()}
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Create engaging content for your audience</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/editor/blog')}
            className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Draft'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSave(true)}
            disabled={saving || !content.title.trim() || !content.body.trim()}
            className="flex-1 sm:flex-none justify-center flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 text-sm"
          >
            <Send className="w-4 h-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Type className="w-4 h-4 mr-2 text-indigo-500" />
              Title <span className="text-rose-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all text-lg font-medium"
              placeholder="Enter your content title..."
            />
          </motion.div>

          {/* Content Body */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
              Content <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <textarea
                value={content.body}
                onChange={(e) => setContent({ ...content, body: e.target.value })}
                rows={20}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all font-mono text-sm leading-relaxed"
                placeholder="Write your content here..."
              />
              <div className="absolute bottom-3 right-3 text-xs px-2 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-md text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {content.body.length} chars
              </div>
            </div>
          </motion.div>

          {/* Excerpt */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <AlignLeft className="w-4 h-4 mr-2 text-indigo-500" />
              Excerpt
            </label>
            <textarea
              value={content.excerpt}
              onChange={(e) => setContent({ ...content, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
              placeholder="Brief description of your content..."
            />
          </motion.div>

          {/* SEO Settings */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white mb-6">
              <Globe className="w-5 h-5 mr-2 text-indigo-500" />
              SEO Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={content.seoTitle}
                  onChange={(e) => setContent({ ...content, seoTitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  placeholder="SEO optimized title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={content.seoDescription}
                  onChange={(e) => setContent({ ...content, seoDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  placeholder="SEO meta description..."
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Status</h3>
            <div className="relative">
              <select
                value={content.status}
                onChange={(e) => setContent({ ...content, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </motion.div>

          {/* Category */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white mb-4">
              <Folder className="w-5 h-5 mr-2 text-indigo-500" />
              Category
            </h3>
            <div className="relative">
              <select
                value={content.category}
                onChange={(e) => setContent({ ...content, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Programming">Programming</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white mb-4">
              <Tag className="w-5 h-5 mr-2 text-indigo-500" />
              Tags
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all text-sm"
                placeholder="Add tag..."
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <AnimatePresence mode="popLayout">
                {content.tags.map((tag) => (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg border border-indigo-100 dark:border-indigo-900/50"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
          >
            <h3 className="flex items-center text-lg font-bold text-slate-900 dark:text-white mb-4">
              <ImageIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Featured Image
            </h3>
            <input
              type="url"
              value={content.featuredImage}
              onChange={(e) => setContent({ ...content, featuredImage: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all mb-4 text-sm"
              placeholder="Image URL..."
            />
            {content.featuredImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                <img
                  src={content.featuredImage}
                  alt="Featured"
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ) : (
              <div className="w-full h-40 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 group hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors">
                <div className="text-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-sm font-medium">No image selected</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentEditor;
