import React, { useState, useEffect, useRef } from 'react';
import TemplateManager from '../utils/TemplateManager';
import './EnhancedTemplatesModal.css';

const EnhancedTemplatesModal = ({ isOpen, onClose, onInsert, currentWidgets = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('Hero');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templateManager] = useState(() => new TemplateManager());
  const [templates, setTemplates] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [importFormat, setImportFormat] = useState('json');
  const [exportFormat, setExportFormat] = useState('json');
  const [selectedTemplateForExport, setSelectedTemplateForExport] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Custom');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedTemplateForVersions, setSelectedTemplateForVersions] = useState(null);
  const [templateVersions, setTemplateVersions] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = templateManager.getAllTemplates();
    setTemplates(allTemplates);
  };

  const filteredTemplates = searchQuery 
    ? templateManager.searchTemplates(searchQuery, selectedCategory)
    : templates[selectedCategory] || [];

  const handleInsert = (template) => {
    onInsert(template.html);
    onClose();
  };

  const openPreview = (template) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  const handleImportTemplate = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = templateManager.importTemplate(text, importFormat);
      
      if (result.success) {
        loadTemplates();
        setShowImportModal(false);
        alert('Template imported successfully!');
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportTemplate = (template) => {
    const result = templateManager.exportTemplate(template.id, exportFormat);
    
    if (result.success) {
      // Create download link
      const blob = new Blob([result.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      setSelectedTemplateForExport(null);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    const template = templateManager.createTemplateFromPage(
      currentWidgets,
      newTemplateName,
      newTemplateCategory
    );
    
    loadTemplates();
    setShowCreateModal(false);
    setNewTemplateName('');
    setNewTemplateCategory('Custom');
    alert('Template created successfully!');
  };

  const handleDeleteTemplate = (template) => {
    if (template.type === 'static') {
      alert('Cannot delete static templates');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      const deleted = templateManager.deleteTemplate(template.id);
      if (deleted) {
        loadTemplates();
        alert('Template deleted successfully!');
      } else {
        alert('Failed to delete template');
      }
    }
  };

  const categories = templateManager.getCategories();

  if (!isOpen) return null;

  return (
    <>
      <div className="enhanced-templates-modal-overlay" onClick={onClose}>
        <div className="enhanced-templates-modal" onClick={(e) => e.stopPropagation()}>
          <div className="enhanced-templates-modal-header">
            <h2>Template Library</h2>
            <div className="template-actions">
              <button 
                className="action-btn import-btn"
                onClick={() => setShowImportModal(true)}
                title="Import Template"
              >
                📥 Import
              </button>
              <button 
                className="action-btn create-btn"
                onClick={() => setShowCreateModal(true)}
                title="Create Template from Current Page"
                disabled={!currentWidgets || currentWidgets.length === 0}
              >
                ➕ Create
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="enhanced-templates-modal-body">
            <div className="template-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="template-categories">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSearchQuery('');
                    }}
                  >
                    {category}
                    <span className="category-count">
                      {(templates[category] || []).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="templates-grid">
              {filteredTemplates.length === 0 ? (
                <div className="no-templates">
                  <p>No templates found</p>
                  {searchQuery && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <div key={template.id} className={`template-card ${template.type}`}>
                    <div className="template-preview">
                      <div className="template-preview-placeholder">
                        {template.name}
                      </div>
                      <div className="template-type-badge">
                        {template.type === 'static' ? '🔒' : '✏️'}
                      </div>
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <div className="template-meta">
                        <span className="template-category">{template.category}</span>
                        {template.tags && (
                          <div className="template-tags">
                            {template.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="template-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="template-actions">
                        <button 
                          className="preview-btn"
                          onClick={() => openPreview(template)}
                        >
                          👁️ Preview
                        </button>
                        <button 
                          className="insert-btn"
                          onClick={() => handleInsert(template)}
                        >
                          ➕ Insert
                        </button>
                        <button 
                          className="export-btn"
                          onClick={() => {
                            setSelectedTemplateForExport(template);
                            setShowExportModal(true);
                          }}
                          title="Export Template"
                        >
                          📤
                        </button>
                        {template.type === 'dynamic' && (
                           <>
                             <button 
                               className="version-btn"
                               onClick={() => {
                                 setSelectedTemplateForVersions(template);
                                 setTemplateVersions(templateManager.getTemplateVersions(template.id));
                                 setShowVersionModal(true);
                               }}
                               title="View Versions"
                             >
                               📋
                             </button>
                             <button 
                               className="delete-btn"
                               onClick={() => handleDeleteTemplate(template)}
                               title="Delete Template"
                             >
                               🗑️
                             </button>
                           </>
                         )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="template-preview-modal-overlay" onClick={closePreview}>
          <div className="template-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="template-preview-modal-header">
              <h3>{previewTemplate.name} Preview</h3>
              <div className="preview-meta">
                <span className="preview-type">{previewTemplate.type}</span>
                <span className="preview-category">{previewTemplate.category}</span>
              </div>
              <button className="close-btn" onClick={closePreview}>×</button>
            </div>
            <div className="template-preview-modal-body">
              <div 
                className="template-preview-content"
                dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
              />
            </div>
            <div className="template-preview-modal-footer">
              <button className="insert-btn" onClick={() => handleInsert(previewTemplate)}>
                ➕ Insert This Template
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <h3>Import Template</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="import-modal-body">
              <div className="format-selector">
                <label>Import Format:</label>
                <select 
                  value={importFormat} 
                  onChange={(e) => setImportFormat(e.target.value)}
                >
                  <option value="json">JSON Template</option>
                  <option value="html">HTML File</option>
                  <option value="widget">Widget Configuration</option>
                </select>
              </div>
              <div className="file-input-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importFormat === 'json' ? '.json' : importFormat === 'html' ? '.html' : '.json'}
                  onChange={handleImportTemplate}
                  className="file-input"
                />
                <p className="import-help">
                  {importFormat === 'json' && 'Select a JSON template file to import'}
                  {importFormat === 'html' && 'Select an HTML file to convert to a template'}
                  {importFormat === 'widget' && 'Select a widget configuration file to import'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && selectedTemplateForExport && (
        <div className="export-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <h3>Export Template: {selectedTemplateForExport.name}</h3>
              <button className="close-btn" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <div className="export-modal-body">
              <div className="format-selector">
                <label>Export Format:</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="json">JSON Template</option>
                  <option value="html">HTML File</option>
                  <option value="widget">Widget Configuration</option>
                </select>
              </div>
              <div className="export-actions">
                <button 
                  className="export-confirm-btn"
                  onClick={() => handleExportTemplate(selectedTemplateForExport)}
                >
                  📤 Export Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h3>Create Template from Current Page</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="create-modal-body">
              <div className="form-group">
                <label>Template Name:</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="template-name-input"
                />
              </div>
              <div className="form-group">
                <label>Category:</label>
                <select 
                  value={newTemplateCategory} 
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="widget-preview">
                <p>Current page has {currentWidgets.length} widgets</p>
              </div>
              <div className="create-actions">
                <button 
                  className="create-confirm-btn"
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName.trim()}
                >
                  ✨ Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Version Modal */}
      {showVersionModal && selectedTemplateForVersions && (
        <div className="modal-overlay">
          <div className="modal-content version-modal">
            <div className="modal-header">
              <h3>Template Versions - {selectedTemplateForVersions.name}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowVersionModal(false);
                  setSelectedTemplateForVersions(null);
                  setTemplateVersions([]);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="current-version">
                <h4>Current Version (v{selectedTemplateForVersions.version || 1})</h4>
                <p>Updated: {new Date(selectedTemplateForVersions.updatedAt || selectedTemplateForVersions.createdAt).toLocaleString()}</p>
              </div>
              
              {templateVersions.length > 0 ? (
                <div className="version-history">
                  <h4>Version History</h4>
                  <div className="version-list">
                    {templateVersions.map((version, index) => (
                      <div key={index} className="version-item">
                        <div className="version-info">
                          <span className="version-number">v{version.version}</span>
                          <span className="version-date">{new Date(version.timestamp).toLocaleString()}</span>
                          {version.note && <span className="version-note">{version.note}</span>}
                        </div>
                        <button 
                          className="rollback-btn"
                          onClick={() => {
                            const result = templateManager.rollbackToVersion(selectedTemplateForVersions.id, version.version);
                            if (result.success) {
                              loadTemplates();
                              setShowVersionModal(false);
                              setSelectedTemplateForVersions(null);
                              setTemplateVersions([]);
                            } else {
                              alert('Failed to rollback: ' + result.error);
                            }
                          }}
                          title="Rollback to this version"
                        >
                          ↶ Rollback
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-versions">No previous versions available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedTemplatesModal;