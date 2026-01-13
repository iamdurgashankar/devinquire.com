import React, { useEffect, useState } from 'react';
import './KeyboardShortcuts.css';

// Keyboard Shortcuts Manager
const KeyboardShortcuts = ({ editor, onAction }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [activeShortcuts, setActiveShortcuts] = useState(new Set());
  const [announcement, setAnnouncement] = useState('');

  // Define keyboard shortcuts
  const shortcuts = {
    // Basic Actions
    'ctrl+z': { action: 'undo', description: 'Undo last action', category: 'Basic' },
    'ctrl+y': { action: 'redo', description: 'Redo last action', category: 'Basic' },
    'ctrl+s': { action: 'save', description: 'Save page', category: 'Basic' },
    'ctrl+c': { action: 'copy', description: 'Copy selected element', category: 'Basic' },
    'ctrl+v': { action: 'paste', description: 'Paste element', category: 'Basic' },
    'ctrl+x': { action: 'cut', description: 'Cut selected element', category: 'Basic' },
    'delete': { action: 'delete', description: 'Delete selected element', category: 'Basic' },
    'backspace': { action: 'delete', description: 'Delete selected element', category: 'Basic' },
    
    // Navigation
    'tab': { action: 'selectNext', description: 'Select next element', category: 'Navigation' },
    'shift+tab': { action: 'selectPrev', description: 'Select previous element', category: 'Navigation' },
    'escape': { action: 'deselect', description: 'Deselect current element', category: 'Navigation' },
    'enter': { action: 'editText', description: 'Edit text content', category: 'Navigation' },
    
    // View Controls
    'ctrl+1': { action: 'deviceDesktop', description: 'Switch to desktop view', category: 'View' },
    'ctrl+2': { action: 'deviceTablet', description: 'Switch to tablet view', category: 'View' },
    'ctrl+3': { action: 'deviceMobile', description: 'Switch to mobile view', category: 'View' },
    'ctrl+p': { action: 'preview', description: 'Toggle preview mode', category: 'View' },
    'ctrl+shift+p': { action: 'fullPreview', description: 'Open full preview', category: 'View' },
    
    // Panel Controls
    'ctrl+shift+w': { action: 'toggleWidgets', description: 'Toggle widgets panel', category: 'Panels' },
    'ctrl+shift+s': { action: 'toggleStyle', description: 'Toggle style panel', category: 'Panels' },
    'ctrl+shift+r': { action: 'toggleResponsive', description: 'Toggle responsive panel', category: 'Panels' },
    
    // Element Manipulation
    'ctrl+d': { action: 'duplicate', description: 'Duplicate selected element', category: 'Elements' },
    'ctrl+g': { action: 'group', description: 'Group selected elements', category: 'Elements' },
    'ctrl+shift+g': { action: 'ungroup', description: 'Ungroup selected elements', category: 'Elements' },
    'ctrl+up': { action: 'moveUp', description: 'Move element up', category: 'Elements' },
    'ctrl+down': { action: 'moveDown', description: 'Move element down', category: 'Elements' },
    'ctrl+left': { action: 'moveLeft', description: 'Move element left', category: 'Elements' },
    'ctrl+right': { action: 'moveRight', description: 'Move element right', category: 'Elements' },
    
    // Quick Actions
    'ctrl+shift+h': { action: 'addHeading', description: 'Add heading element', category: 'Quick Add' },
    'ctrl+shift+t': { action: 'addText', description: 'Add text element', category: 'Quick Add' },
    'ctrl+shift+b': { action: 'addButton', description: 'Add button element', category: 'Quick Add' },
    'ctrl+shift+i': { action: 'addImage', description: 'Add image element', category: 'Quick Add' },
    
    // Help
    'ctrl+shift+?': { action: 'showHelp', description: 'Show keyboard shortcuts', category: 'Help' },
    'f1': { action: 'showHelp', description: 'Show keyboard shortcuts', category: 'Help' }
  };

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e) => {
      // Handle help toggle
      if ((e.ctrlKey && e.shiftKey && e.key === '?') || e.key === 'F1') {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }
      
      // Close help modal with Escape
      if (e.key === 'Escape' && showHelp) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }
      
      // Focus trap for modal
      if (showHelp && e.key === 'Tab') {
        const modal = document.querySelector('.cms-shortcuts-modal');
        const focusableElements = modal?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
        return;
      }
      
      const key = getKeyString(e);
      const shortcut = shortcuts[key];
      
      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        
        // Add visual feedback
        setActiveShortcuts(prev => new Set([...prev, key]));
        
        // Announce action for screen readers
        setAnnouncement(`${shortcut.description} activated`);
        setTimeout(() => setAnnouncement(''), 1000);
        
        setTimeout(() => {
          setActiveShortcuts(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, 200);
        
        executeAction(shortcut.action, e);
      }
    };

    // Bind to document to catch all keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  const getKeyString = (e) => {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    const key = e.key.toLowerCase();
    if (key === ' ') {
      parts.push('space');
    } else if (key === 'arrowup') {
      parts.push('up');
    } else if (key === 'arrowdown') {
      parts.push('down');
    } else if (key === 'arrowleft') {
      parts.push('left');
    } else if (key === 'arrowright') {
      parts.push('right');
    } else {
      parts.push(key);
    }
    
    return parts.join('+');
  };

  const executeAction = (action, event) => {
    if (!editor) return;

    const selectedComponent = editor.getSelected();
    
    switch (action) {
      case 'undo':
        editor.UndoManager.undo();
        break;
        
      case 'redo':
        editor.UndoManager.redo();
        break;
        
      case 'save':
        onAction?.('save');
        break;
        
      case 'copy':
        if (selectedComponent) {
          editor.CopyPaste.copy(selectedComponent);
          showNotification('Element copied');
        }
        break;
        
      case 'paste':
        const clipboard = editor.CopyPaste.getClipboard();
        if (clipboard.length > 0) {
          editor.CopyPaste.paste();
          showNotification('Element pasted');
        }
        break;
        
      case 'cut':
        if (selectedComponent) {
          editor.CopyPaste.copy(selectedComponent);
          selectedComponent.remove();
          showNotification('Element cut');
        }
        break;
        
      case 'delete':
        if (selectedComponent) {
          selectedComponent.remove();
          showNotification('Element deleted');
        }
        break;
        
      case 'duplicate':
        if (selectedComponent) {
          const cloned = selectedComponent.clone();
          selectedComponent.parent().append(cloned);
          editor.select(cloned);
          showNotification('Element duplicated');
        }
        break;
        
      case 'selectNext':
        selectNextElement();
        break;
        
      case 'selectPrev':
        selectPrevElement();
        break;
        
      case 'deselect':
        editor.select(null);
        break;
        
      case 'editText':
        if (selectedComponent && isTextElement(selectedComponent)) {
          // Trigger inline editing
          const element = selectedComponent.getEl();
          if (element) {
            element.dispatchEvent(new Event('dblclick', { bubbles: true }));
          }
        }
        break;
        
      case 'deviceDesktop':
        editor.setDevice('Desktop');
        onAction?.('deviceChange', 'desktop');
        break;
        
      case 'deviceTablet':
        editor.setDevice('Tablet');
        onAction?.('deviceChange', 'tablet');
        break;
        
      case 'deviceMobile':
        editor.setDevice('Mobile');
        onAction?.('deviceChange', 'mobile');
        break;
        
      case 'preview':
        onAction?.('togglePreview');
        break;
        
      case 'fullPreview':
        onAction?.('fullPreview');
        break;
        
      case 'toggleWidgets':
        onAction?.('togglePanel', 'widgets');
        break;
        
      case 'toggleStyle':
        onAction?.('togglePanel', 'style');
        break;
        
      case 'toggleResponsive':
        onAction?.('togglePanel', 'responsive');
        break;
        
      case 'moveUp':
        if (selectedComponent) {
          moveElement(selectedComponent, 'up');
        }
        break;
        
      case 'moveDown':
        if (selectedComponent) {
          moveElement(selectedComponent, 'down');
        }
        break;
        
      case 'addHeading':
        addQuickElement('heading');
        break;
        
      case 'addText':
        addQuickElement('text');
        break;
        
      case 'addButton':
        addQuickElement('button');
        break;
        
      case 'addImage':
        addQuickElement('image');
        break;
        
      case 'showHelp':
        setShowHelp(true);
        break;
        
      default:
        onAction?.(action, event);
    }
  };

  const isTextElement = (component) => {
    const type = component.get('type');
    const tagName = component.get('tagName');
    return ['text', 'textnode'].includes(type) || 
           ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'a'].includes(tagName?.toLowerCase());
  };

  const selectNextElement = () => {
    const components = editor.DomComponents.getWrapper().find('*');
    const selected = editor.getSelected();
    
    if (!selected) {
      if (components.length > 0) {
        editor.select(components[0]);
      }
      return;
    }
    
    const currentIndex = components.indexOf(selected);
    const nextIndex = (currentIndex + 1) % components.length;
    editor.select(components[nextIndex]);
  };

  const selectPrevElement = () => {
    const components = editor.DomComponents.getWrapper().find('*');
    const selected = editor.getSelected();
    
    if (!selected) {
      if (components.length > 0) {
        editor.select(components[components.length - 1]);
      }
      return;
    }
    
    const currentIndex = components.indexOf(selected);
    const prevIndex = currentIndex === 0 ? components.length - 1 : currentIndex - 1;
    editor.select(components[prevIndex]);
  };

  const moveElement = (component, direction) => {
    const parent = component.parent();
    const siblings = parent.components();
    const currentIndex = siblings.indexOf(component);
    
    if (direction === 'up' && currentIndex > 0) {
      parent.components().remove(component);
      parent.components().add(component, { at: currentIndex - 1 });
      showNotification('Element moved up');
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      parent.components().remove(component);
      parent.components().add(component, { at: currentIndex + 1 });
      showNotification('Element moved down');
    }
  };

  const addQuickElement = (type) => {
    const wrapper = editor.DomComponents.getWrapper();
    let component;
    
    switch (type) {
      case 'heading':
        component = wrapper.append({
          type: 'text',
          tagName: 'h2',
          content: 'New Heading',
          style: { 'font-size': '24px', 'font-weight': 'bold', 'margin': '16px 0' }
        })[0];
        break;
        
      case 'text':
        component = wrapper.append({
          type: 'text',
          tagName: 'p',
          content: 'New text paragraph',
          style: { 'margin': '16px 0' }
        })[0];
        break;
        
      case 'button':
        component = wrapper.append({
          type: 'button',
          content: 'Click me',
          style: {
            'padding': '12px 24px',
            'background-color': '#3b82f6',
            'color': 'white',
            'border': 'none',
            'border-radius': '6px',
            'cursor': 'pointer'
          }
        })[0];
        break;
        
      case 'image':
        component = wrapper.append({
          type: 'image',
          src: 'https://via.placeholder.com/300x200',
          style: { 'max-width': '100%', 'height': 'auto' }
        })[0];
        break;
    }
    
    if (component) {
      editor.select(component);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added`);
    }
  };

  const showNotification = (message) => {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'cms-keyboard-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const groupedShortcuts = Object.entries(shortcuts).reduce((acc, [key, shortcut]) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push({ key, ...shortcut });
    return acc;
  }, {});

  return (
    <>
      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div 
          className="cms-shortcuts-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          aria-describedby="shortcuts-description"
        >
          <div className="cms-shortcuts-content">
            <div className="cms-shortcuts-header">
              <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
              <button 
                className="cms-shortcuts-close"
                onClick={() => setShowHelp(false)}
                title="Close (Esc)"
                aria-label="Close keyboard shortcuts dialog"
              >
                ✕
              </button>
            </div>
            
            <div className="cms-shortcuts-body" id="shortcuts-description">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category} className="cms-shortcuts-category" role="group" aria-labelledby={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                  <h3 id={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}>{category}</h3>
                  <div className="cms-shortcuts-list" role="list">
                    {shortcuts.map(({ key, description }) => (
                      <div key={key} className="cms-shortcut-item" role="listitem">
                        <div className="cms-shortcut-keys" aria-label={`Keyboard shortcut: ${key.replace(/\+/g, ' plus ')}`}>
                          {key.split('+').map((k, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="cms-shortcut-plus" aria-hidden="true">+</span>}
                              <kbd className="cms-shortcut-key">{k}</kbd>
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="cms-shortcut-desc">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cms-shortcuts-footer">
              <p>Press <kbd>Ctrl+Shift+?</kbd> or <kbd>F1</kbd> to show this help again</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Screen Reader Announcements */}
      {announcement && (
        <div 
          className="cms-sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {announcement}
        </div>
      )}
      
      {/* Active Shortcuts Indicator */}
      {activeShortcuts.size > 0 && (
        <div className="cms-active-shortcuts">
          {Array.from(activeShortcuts).map(key => (
            <div key={key} className="cms-active-shortcut">
              {key.split('+').map((k, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>+</span>}
                  <kbd>{k}</kbd>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts;