import React, { useState, useEffect, useRef } from 'react';
import './LiveEditor.css';

// Live Editor Component for real-time content editing
const LiveEditor = ({ editor, selectedElement }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [editPosition, setEditPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    // Enable inline editing on double-click
    const handleDoubleClick = (e) => {
      const target = e.target;
      const component = editor.DomComponents.getWrapper().find(comp => comp.getEl() === target)[0];
      
      if (component && isTextElement(component)) {
        startInlineEdit(component, target);
      }
    };

    // Auto-save on content change
    const handleContentChange = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        triggerAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    };

    // Bind events
    const canvas = editor.Canvas.getElement();
    if (canvas) {
      canvas.addEventListener('dblclick', handleDoubleClick);
    }
    
    editor.on('component:update', handleContentChange);
    editor.on('component:add', handleContentChange);
    editor.on('component:remove', handleContentChange);

    return () => {
      if (canvas) {
        canvas.removeEventListener('dblclick', handleDoubleClick);
      }
      
      editor.off('component:update', handleContentChange);
      editor.off('component:add', handleContentChange);
      editor.off('component:remove', handleContentChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor]);

  const isTextElement = (component) => {
    const type = component.get('type');
    const tagName = component.get('tagName');
    return ['text', 'textnode'].includes(type) || 
           ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'a'].includes(tagName?.toLowerCase());
  };

  const startInlineEdit = (component, element) => {
    const rect = element.getBoundingClientRect();
    const content = component.get('content') || element.textContent || '';
    
    setEditableContent(content);
    setEditPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
    setIsEditing(true);
    
    // Store reference to the component being edited
    editorRef.current = { component, element };
    
    // Hide the original element temporarily
    element.style.opacity = '0.3';
  };

  const finishInlineEdit = () => {
    if (editorRef.current) {
      const { component, element } = editorRef.current;
      
      // Update component content
      component.set('content', editableContent);
      
      // Restore element visibility
      element.style.opacity = '1';
      
      // Trigger change event
      editor.trigger('component:update', component);
    }
    
    setIsEditing(false);
    setEditableContent('');
    editorRef.current = null;
  };

  const cancelInlineEdit = () => {
    if (editorRef.current) {
      const { element } = editorRef.current;
      element.style.opacity = '1';
    }
    
    setIsEditing(false);
    setEditableContent('');
    editorRef.current = null;
  };

  const triggerAutoSave = () => {
    // Emit auto-save event
    if (editor) {
      editor.trigger('storage:store');
      
      // Dispatch custom event for save indicator
      window.dispatchEvent(new CustomEvent('cms:autosave', {
        detail: { timestamp: Date.now() }
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelInlineEdit();
    }
  };

  return (
    <>
      {/* Inline Text Editor */}
      {isEditing && (
        <div 
          className="cms-inline-editor"
          style={{
            position: 'fixed',
            top: editPosition.top,
            left: editPosition.left,
            width: Math.max(editPosition.width, 200),
            minHeight: editPosition.height,
            zIndex: 10004
          }}
        >
          <textarea
            className="cms-inline-textarea"
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={finishInlineEdit}
            autoFocus
            placeholder="Enter your text..."
          />
          <div className="cms-inline-toolbar">
            <button 
              className="cms-inline-btn cms-inline-save"
              onClick={finishInlineEdit}
              title="Save (Enter)"
            >
              ✓
            </button>
            <button 
              className="cms-inline-btn cms-inline-cancel"
              onClick={cancelInlineEdit}
              title="Cancel (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Real-time Preview Component
export const RealTimePreview = ({ editor }) => {
  const [previewContent, setPreviewContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updatePreview = () => {
      const html = editor.getHtml();
      const css = editor.getCss();
      
      const fullContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      setPreviewContent(fullContent);
    };

    // Update preview on changes
    editor.on('component:update', updatePreview);
    editor.on('component:add', updatePreview);
    editor.on('component:remove', updatePreview);
    editor.on('component:styleUpdate', updatePreview);
    
    // Initial preview
    updatePreview();

    return () => {
      editor.off('component:update', updatePreview);
      editor.off('component:add', updatePreview);
      editor.off('component:remove', updatePreview);
      editor.off('component:styleUpdate', updatePreview);
    };
  }, [editor]);

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    
    if (editor) {
      // Toggle editor visibility
      const editorEl = editor.getContainer();
      if (editorEl) {
        editorEl.style.display = isPreviewMode ? 'block' : 'none';
      }
    }
  };

  return (
    <>
      {/* Preview Toggle Button */}
      <button 
        className="cms-preview-toggle"
        onClick={togglePreview}
        title={isPreviewMode ? 'Exit Preview' : 'Enter Preview Mode'}
      >
        {isPreviewMode ? '✏️ Edit' : '👁️ Preview'}
      </button>

      {/* Full Preview Modal */}
      {isPreviewMode && (
        <div className="cms-preview-modal">
          <div className="cms-preview-header">
            <h3>Live Preview</h3>
            <div className="cms-preview-controls">
              <button 
                className="cms-preview-btn"
                onClick={() => window.open('data:text/html,' + encodeURIComponent(previewContent), '_blank')}
                title="Open in New Tab"
              >
                🔗 Open
              </button>
              <button 
                className="cms-preview-btn cms-preview-close"
                onClick={togglePreview}
                title="Close Preview"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="cms-preview-content">
            <iframe
              srcDoc={previewContent}
              className="cms-preview-iframe"
              title="Live Preview"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Auto-save Manager Component
export const AutoSaveManager = ({ editor, onSaveStatusChange }) => {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleAutoSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus('saving');
      onSaveStatusChange?.('saving');

      // Simulate save operation
      saveTimeoutRef.current = setTimeout(() => {
        try {
          // Store in localStorage as backup
          const data = {
            html: editor.getHtml(),
            css: editor.getCss(),
            timestamp: Date.now()
          };
          
          localStorage.setItem('cms_autosave', JSON.stringify(data));
          
          setSaveStatus('saved');
          setLastSaved(Date.now());
          onSaveStatusChange?.('saved', Date.now());
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setSaveStatus('idle');
            onSaveStatusChange?.('idle');
          }, 3000);
          
        } catch (error) {
          console.error('Auto-save failed:', error);
          setSaveStatus('error');
          onSaveStatusChange?.('error');
        }
      }, 1000);
    };

    // Listen for auto-save events
    const handleCustomAutoSave = () => {
      handleAutoSave();
    };

    window.addEventListener('cms:autosave', handleCustomAutoSave);
    editor.on('storage:store', handleAutoSave);

    // Auto-save on page unload
    const handleBeforeUnload = () => {
      handleAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('cms:autosave', handleCustomAutoSave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      editor.off('storage:store', handleAutoSave);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, onSaveStatusChange]);

  // Restore from auto-save on load
  useEffect(() => {
    if (!editor) return;

    const restoreAutoSave = () => {
      try {
        const saved = localStorage.getItem('cms_autosave');
        if (saved) {
          const data = JSON.parse(saved);
          const timeDiff = Date.now() - data.timestamp;
          
          // Only restore if saved within last hour
          if (timeDiff < 3600000) {
            const shouldRestore = window.confirm(
              `Found auto-saved content from ${new Date(data.timestamp).toLocaleString()}. Restore it?`
            );
            
            if (shouldRestore) {
              editor.setComponents(data.html);
              editor.setStyle(data.css);
              setLastSaved(data.timestamp);
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore auto-save:', error);
      }
    };

    // Restore after editor is ready
    setTimeout(restoreAutoSave, 1000);
  }, [editor]);

  return null; // This component doesn't render anything
};

export default LiveEditor;