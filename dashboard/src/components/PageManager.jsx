import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pageManagementService from '../services/pageManagementService';

export default function PageManager() {
  const [pages, setPages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageTemplate, setNewPageTemplate] = useState('default');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const navigate = useNavigate();

  // Real-time subscription ID
  const [subscriptionId, setSubscriptionId] = useState(null);

  // Load pages
  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load pages from Firebase
      const result = await pageManagementService.getPages({
        status: filter === 'all' ? null : filter,
        searchTerm: searchTerm || null,
        limit: 50
      });
      
      if (result.success) {
        setPages(result.pages);
      } else {
        console.error('Failed to load pages:', result.error);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const result = await pageManagementService.getTemplates({ isPublic: true });
      if (result.success) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  useEffect(() => {
    loadPages();
    loadTemplates();

    // Set up real-time subscription for Firebase
    const id = pageManagementService.subscribeToPages(
      { status: filter === 'all' ? null : filter },
      (result) => {
        if (result.success) {
          setPages(result.pages);
        }
      }
    );
    setSubscriptionId(id);

    return () => {
      if (id) {
        pageManagementService.unsubscribe(id);
      }
    };
  }, [loadPages, loadTemplates, filter]);

  // Create new page
  const handleCreate = async () => {
    if (!newPageTitle.trim()) {
      alert('Please enter a page title');
      return;
    }

    try {
      setCreating(true);
      
      const result = await pageManagementService.createPage({
        title: newPageTitle,
        template: newPageTemplate,
        status: 'draft'
      });
      
      if (result.success) {
        setNewPageTitle('');
        setNewPageTemplate('default');
        setShowCreateModal(false);
        // Page created successfully
        alert('Page created successfully!');
      } else {
        alert(`Failed to create page: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Failed to create page. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Edit page
  const handleEdit = (page) => {
    alert('Page editing functionality has been removed.');
  };

  // Duplicate page
  const handleDuplicate = async (page) => {
    try {
      const newTitle = prompt('Enter title for duplicated page:', `${page.title} (Copy)`);
      if (!newTitle) return;

      const result = await pageManagementService.duplicatePage(page.id, newTitle);
      if (result.success) {
        alert('Page duplicated successfully!');
        loadPages();
      } else {
        alert(`Failed to duplicate page: ${result.error}`);
      }
    } catch (error) {
      console.error('Error duplicating page:', error);
      alert('Failed to duplicate page. Please try again.');
    }
  };

  // Delete page
  const handleDelete = async (page) => {
    if (!confirm(`Are you sure you want to delete "${page.title || page.id}"?`)) {
      return;
    }

    try {
      const result = await pageManagementService.deletePage(page.id);
      if (result.success) {
        alert('Page deleted successfully!');
        loadPages();
      } else {
        alert(`Failed to delete page: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  // Filter pages
  const filteredPages = pages.filter(page => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (page.title && page.title.toLowerCase().includes(term)) ||
        (page.slug && page.slug.toLowerCase().includes(term)) ||
        (page.id && page.id.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Never';
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'private': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Page Manager</h1>
          <p className="text-gray-600 mt-1">
            Firebase-powered • {filteredPages.length} pages
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            📝 Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Create Page
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'published' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts
            </button>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading pages...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No pages found' : 'No pages yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first page to get started'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Page
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {page.title || page.id}
                          </div>
                          {page.slug && (
                            <div className="text-sm text-gray-500">/{page.slug}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(page.status || 'draft')
                        }`}>
                          {page.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.author?.displayName || page.author?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.template || 'default'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(page.updatedAt || page.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(page)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit page"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDuplicate(page)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Duplicate page"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleDelete(page)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete page"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Page</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={newPageTemplate}
                    onChange={(e) => setNewPageTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="default">Default</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newPageTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Page Templates</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600">No templates available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Used {template.usageCount || 0} times
                      </span>
                      <button
                        onClick={() => {
                          setNewPageTemplate(template.id);
                          setShowTemplateModal(false);
                          setShowCreateModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}