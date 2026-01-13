import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Calendar,
  MoreVertical,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react';

const BlogManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setPosts([
        {
          id: 1,
          title: 'Getting Started with React',
          content: 'This is a comprehensive guide to React...',
          status: 'published',
          author: 'John Editor',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-16',
          views: 1250,
          category: 'Technology'
        },
        {
          id: 2,
          title: 'Advanced JavaScript Concepts',
          content: 'Deep dive into advanced JavaScript...',
          status: 'draft',
          author: 'John Editor',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14',
          views: 0,
          category: 'Programming'
        },
        {
          id: 3,
          title: 'UI/UX Design Principles',
          content: 'Essential principles for great design...',
          status: 'published',
          author: 'John Editor',
          createdAt: '2024-01-13',
          updatedAt: '2024-01-13',
          views: 890,
          category: 'Design'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.status === filter;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusStyles = {
      published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      archived: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    };

    const icons = {
      published: <CheckCircle className="w-3 h-3 mr-1" />,
      draft: <Clock className="w-3 h-3 mr-1" />,
      archived: <Archive className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const handleStatusChange = (postId, newStatus) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, status: newStatus } : post
    ));
  };

  if (location.pathname !== '/editor/blog') {
    return (
      <Routes>
        <Route path="/create" element={<BlogEditor />} />
        <Route path="/edit/:id" element={<BlogEditor />} />
      </Routes>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create and manage your blog posts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/editor/blog/create')}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </motion.button>
      </div>

      {/* Filters and Search */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-4 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'published', 'draft', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-100/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Posts List */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading posts...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Title & Content
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-slate-200 dark:divide-slate-700"
              >
                <AnimatePresence>
                  {filteredPosts.map((post) => (
                    <motion.tr
                      key={post.id}
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg mr-3">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{post.title}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                              {post.content.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <Eye className="w-4 h-4 mr-1.5 text-slate-400" />
                          {post.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => navigate(`/editor/blog/edit/${post.id}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <select
                            value={post.status}
                            onChange={(e) => handleStatusChange(post.id, e.target.value)}
                            className="text-xs border-none bg-transparent text-slate-500 focus:ring-0 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Publish</option>
                            <option value="archived">Archive</option>
                          </select>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No posts found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Blog Editor Component (placeholder)
const BlogEditor = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Blog Editor</h1>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-8 text-center hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
      >
        <div className="w-16 h-16 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Edit2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Editor Coming Soon</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          The full-featured blog editor component is under development. It will include rich text editing, media management, and SEO tools.
        </p>
      </motion.div>
    </div>
  );
};

export default BlogManager;