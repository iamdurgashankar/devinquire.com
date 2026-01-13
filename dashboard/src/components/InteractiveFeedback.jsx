import React, { useState, useEffect } from 'react';
import './InteractiveFeedback.css';

// Visual feedback component for enhanced CMS interactions
const InteractiveFeedback = ({ editor, selectedElement }) => {
  const [dragPreview, setDragPreview] = useState(null);
  const [hoverElement, setHoverElement] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!editor) return;

    // Add hover effects
    const handleMouseOver = (e) => {
      const component = e.target;
      if (component && component !== selectedElement) {
        setHoverElement(component);
        component.classList.add('cms-hover-highlight');
      }
    };

    const handleMouseOut = (e) => {
      const component = e.target;
      if (component) {
        component.classList.remove('cms-hover-highlight');
        setHoverElement(null);
      }
    };

    // Add selection indicators
    const handleSelection = (component) => {
      // Remove previous selection indicators
      document.querySelectorAll('.cms-selected').forEach(el => {
        el.classList.remove('cms-selected');
      });

      if (component) {
        const element = component.getEl();
        if (element) {
          element.classList.add('cms-selected');
          
          // Create selection box with resize handles
          const rect = element.getBoundingClientRect();
          setSelectionBox({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      } else {
        setSelectionBox(null);
      }
    };

    // Add drag preview
    const handleDragStart = (component) => {
      setIsDragging(true);
      const element = component.getEl();
      if (element) {
        setDragPreview({
          content: element.outerHTML,
          type: component.get('type')
        });
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      setDragPreview(null);
    };

    // Bind events
    editor.on('component:selected', handleSelection);
    editor.on('component:deselected', () => handleSelection(null));
    editor.on('component:drag:start', handleDragStart);
    editor.on('component:drag:end', handleDragEnd);

    // Add canvas event listeners
    const canvas = editor.Canvas.getElement();
    if (canvas) {
      canvas.addEventListener('mouseover', handleMouseOver);
      canvas.addEventListener('mouseout', handleMouseOut);
    }

    return () => {
      editor.off('component:selected', handleSelection);
      editor.off('component:deselected', () => handleSelection(null));
      editor.off('component:drag:start', handleDragStart);
      editor.off('component:drag:end', handleDragEnd);
      
      if (canvas) {
        canvas.removeEventListener('mouseover', handleMouseOver);
        canvas.removeEventListener('mouseout', handleMouseOut);
      }
    };
  }, [editor, selectedElement]);

  return (
    <>
      {/* Selection Box with Resize Handles */}
      {selectionBox && (
        <div 
          className="cms-selection-box"
          style={{
            position: 'fixed',
            top: selectionBox.top,
            left: selectionBox.left,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div className="cms-selection-border"></div>
          <div className="cms-resize-handle cms-resize-nw"></div>
          <div className="cms-resize-handle cms-resize-ne"></div>
          <div className="cms-resize-handle cms-resize-sw"></div>
          <div className="cms-resize-handle cms-resize-se"></div>
          <div className="cms-resize-handle cms-resize-n"></div>
          <div className="cms-resize-handle cms-resize-s"></div>
          <div className="cms-resize-handle cms-resize-e"></div>
          <div className="cms-resize-handle cms-resize-w"></div>
        </div>
      )}

      {/* Drag Preview */}
      {isDragging && dragPreview && (
        <div className="cms-drag-preview">
          <div className="cms-drag-preview-content">
            <div className="cms-drag-preview-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="cms-drag-preview-text">
              Moving {dragPreview.type || 'Element'}
            </span>
          </div>
        </div>
      )}

      {/* Drop Zone Indicators */}
      <div className="cms-drop-zones">
        {/* These will be dynamically positioned based on valid drop targets */}
      </div>
    </>
  );
};

// Quick Action Toolbar Component
export const QuickActionToolbar = ({ selectedElement, editor, onAction }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (selectedElement && editor) {
      const element = selectedElement.getEl();
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top - 50,
          left: rect.left + rect.width / 2 - 100
        });
        setVisible(true);
      }
    } else {
      setVisible(false);
    }
  }, [selectedElement, editor]);

  if (!visible) return null;

  const actions = [
    {
      icon: '✏️',
      label: 'Edit',
      action: 'edit',
      shortcut: 'E'
    },
    {
      icon: '🎨',
      label: 'Style',
      action: 'style',
      shortcut: 'S'
    },
    {
      icon: '📋',
      label: 'Copy',
      action: 'copy',
      shortcut: 'Ctrl+C'
    },
    {
      icon: '🗑️',
      label: 'Delete',
      action: 'delete',
      shortcut: 'Del'
    },
    {
      icon: '⬆️',
      label: 'Move Up',
      action: 'moveUp',
      shortcut: '↑'
    },
    {
      icon: '⬇️',
      label: 'Move Down',
      action: 'moveDown',
      shortcut: '↓'
    }
  ];

  return (
    <div 
      className="cms-quick-toolbar"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000
      }}
    >
      <div className="cms-toolbar-content">
        {actions.map((action, index) => (
          <button
            key={index}
            className="cms-toolbar-button"
            onClick={() => onAction(action.action)}
            title={`${action.label} (${action.shortcut})`}
          >
            <span className="cms-toolbar-icon">{action.icon}</span>
          </button>
        ))}
      </div>
      <div className="cms-toolbar-arrow"></div>
    </div>
  );
};

// Save Indicator Component
export const SaveIndicator = ({ saveStatus, lastSaved }) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'error') {
      setShowIndicator(true);
      if (saveStatus === 'saved') {
        const timer = setTimeout(() => setShowIndicator(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [saveStatus]);

  if (!showIndicator) return null;

  return (
    <div className={`cms-save-indicator cms-save-${saveStatus}`}>
      <div className="cms-save-content">
        {saveStatus === 'saving' && (
          <>
            <div className="cms-save-spinner"></div>
            <span>Saving...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <div className="cms-save-checkmark">✓</div>
            <span>Saved {lastSaved && new Date(lastSaved).toLocaleTimeString()}</span>
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <div className="cms-save-error">⚠️</div>
            <span>Save failed</span>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveFeedback;