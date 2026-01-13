import React, { useState, useEffect, useRef } from 'react';
import './ContextualToolbar.css';

const ContextualToolbar = ({ 
  editor, 
  selectedElement, 
  visible, 
  position, 
  onAction 
}) => {
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (visible && selectedElement && position) {
      // Calculate optimal toolbar position
      const rect = position;
      const toolbarHeight = 40;
      const toolbarWidth = 200;
      
      let top = rect.top - toolbarHeight - 10;
      let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
      
      // Ensure toolbar stays within viewport
      if (top < 10) {
        top = rect.bottom + 10;
      }
      
      if (left < 10) {
        left = 10;
      } else if (left + toolbarWidth > window.innerWidth - 10) {
        left = window.innerWidth - toolbarWidth - 10;
      }
      
      setToolbarPosition({ top, left });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [visible, selectedElement, position]);

  const handleAction = (action) => {
    if (onAction) {
      onAction(action, selectedElement);
    }
  };

  const getElementInfo = () => {
    if (!selectedElement) return null;
    
    const tagName = selectedElement.get('tagName') || 'div';
    const classes = selectedElement.get('classes')?.join(' ') || '';
    const id = selectedElement.get('attributes')?.id || '';
    
    return {
      tagName: tagName.toLowerCase(),
      classes,
      id
    };
  };

  const elementInfo = getElementInfo();

  if (!isVisible || !selectedElement) {
    return null;
  }

  return (
    <div 
      ref={toolbarRef}
      className="contextual-toolbar"
      style={{
        position: 'fixed',
        top: `${toolbarPosition.top}px`,
        left: `${toolbarPosition.left}px`,
        zIndex: 10000
      }}
    >
      <div className="toolbar-content">
        {/* Element Info */}
        <div className="element-info">
          <span className="element-tag">{elementInfo?.tagName}</span>
          {elementInfo?.id && (
            <span className="element-id">#{elementInfo.id}</span>
          )}
          {elementInfo?.classes && (
            <span className="element-classes">.{elementInfo.classes.split(' ').join('.')}</span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="toolbar-actions">
          <button 
            className="toolbar-btn"
            onClick={() => handleAction('edit')}
            title="Edit Content (Double-click)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={() => handleAction('duplicate')}
            title="Duplicate Element (Ctrl+D)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={() => handleAction('copy')}
            title="Copy Element (Ctrl+C)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          
          <div className="toolbar-separator"></div>
          
          <button 
            className="toolbar-btn"
            onClick={() => handleAction('moveUp')}
            title="Move Up"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={() => handleAction('moveDown')}
            title="Move Down"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          
          <div className="toolbar-separator"></div>
          
          <button 
            className="toolbar-btn toolbar-btn-danger"
            onClick={() => handleAction('delete')}
            title="Delete Element (Delete)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Tooltip Arrow */}
      <div className="toolbar-arrow"></div>
    </div>
  );
};

export default ContextualToolbar;