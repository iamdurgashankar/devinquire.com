import React, { useState, useEffect } from 'react';
import './ResponsiveControls.css';

const ResponsiveControls = ({ editor, onDeviceChange }) => {
  const [activeDevice, setActiveDevice] = useState('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Device breakpoints (similar to Elementor)
  const devices = {
    desktop: {
      id: 'desktop',
      label: 'Desktop',
      icon: '🖥️',
      width: '100%',
      minWidth: 1025,
      tooltip: 'Desktop (1025px and up)'
    },
    tablet: {
      id: 'tablet',
      label: 'Tablet',
      icon: '📱',
      width: '768px',
      minWidth: 768,
      maxWidth: 1024,
      tooltip: 'Tablet (768px - 1024px)'
    },
    mobile: {
      id: 'mobile',
      label: 'Mobile',
      icon: '📱',
      width: '375px',
      minWidth: 320,
      maxWidth: 767,
      tooltip: 'Mobile (320px - 767px)'
    }
  };

  // Handle device change
  const handleDeviceChange = (deviceId) => {
    setActiveDevice(deviceId);
    const device = devices[deviceId];
    
    if (editor) {
      // Update canvas size
      const canvas = editor.Canvas.getElement();
      if (canvas) {
        const canvasBody = canvas.contentDocument.body;
        if (device.width === '100%') {
          canvasBody.style.width = '100%';
          canvasBody.style.maxWidth = 'none';
        } else {
          canvasBody.style.width = device.width;
          canvasBody.style.maxWidth = device.width;
        }
        
        // Add device class for CSS targeting
        canvasBody.className = `gjs-device-${deviceId}`;
      }
      
      // Update editor device
      editor.setDevice(deviceId);
    }
    
    // Notify parent component
    if (onDeviceChange) {
      onDeviceChange(deviceId, device);
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
    if (editor) {
      if (!isPreviewMode) {
        editor.runCommand('preview');
      } else {
        editor.stopCommand('preview');
      }
    }
  };

  // Initialize editor devices
  useEffect(() => {
    if (editor) {
      // Add devices to editor
      Object.values(devices).forEach(device => {
        editor.DeviceManager.add(device.id, {
          name: device.label,
          width: device.width,
          widthMedia: device.minWidth
        });
      });
      
      // Set initial device
      handleDeviceChange('desktop');
    }
  }, [editor]);

  return (
    <div className="responsive-controls">
      {/* Device Switcher */}
      <div className="device-switcher">
        <div className="device-buttons">
          {Object.values(devices).map(device => (
            <button
              key={device.id}
              className={`device-btn ${activeDevice === device.id ? 'active' : ''}`}
              onClick={() => handleDeviceChange(device.id)}
              title={device.tooltip}
            >
              <span className="device-icon">{device.icon}</span>
              <span className="device-label">{device.label}</span>
            </button>
          ))}
        </div>
        
        {/* Device Info */}
        <div className="device-info">
          <span className="current-device">
            {devices[activeDevice].label}
          </span>
          <span className="device-dimensions">
            {devices[activeDevice].width}
          </span>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="preview-controls">
        <button
          className={`preview-btn ${isPreviewMode ? 'active' : ''}`}
          onClick={togglePreviewMode}
          title={isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
        >
          <span className="preview-icon">{isPreviewMode ? '✏️' : '👁️'}</span>
          <span className="preview-label">
            {isPreviewMode ? 'Edit' : 'Preview'}
          </span>
        </button>
      </div>

      {/* Responsive Indicator */}
      <div className="responsive-indicator">
        <div className="breakpoint-info">
          <span className="breakpoint-label">Breakpoint:</span>
          <span className="breakpoint-range">
            {devices[activeDevice].minWidth}
            {devices[activeDevice].maxWidth && `- ${devices[activeDevice].maxWidth}`}
            px
          </span>
        </div>
      </div>

      {/* Responsive Tips */}
      {activeDevice !== 'desktop' && (
        <div className="responsive-tips">
          <div className="tip-item">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              Editing {devices[activeDevice].label.toLowerCase()} view. 
              Changes will only affect this breakpoint.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive Settings Panel Component
export const ResponsiveSettingsPanel = ({ editor, selectedElement }) => {
  const [settings, setSettings] = useState({
    desktop: {},
    tablet: {},
    mobile: {}
  });
  
  const [activeDevice, setActiveDevice] = useState('desktop');

  // Common responsive properties
  const responsiveProperties = {
    display: {
      label: 'Display',
      type: 'select',
      options: ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'],
      default: 'block'
    },
    width: {
      label: 'Width',
      type: 'slider',
      min: 0,
      max: 100,
      unit: '%',
      default: 100
    },
    height: {
      label: 'Height',
      type: 'input',
      unit: 'px',
      default: 'auto'
    },
    margin: {
      label: 'Margin',
      type: 'spacing',
      properties: ['top', 'right', 'bottom', 'left'],
      unit: 'px',
      default: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    padding: {
      label: 'Padding',
      type: 'spacing',
      properties: ['top', 'right', 'bottom', 'left'],
      unit: 'px',
      default: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    fontSize: {
      label: 'Font Size',
      type: 'slider',
      min: 8,
      max: 72,
      unit: 'px',
      default: 16
    },
    textAlign: {
      label: 'Text Align',
      type: 'select',
      options: ['left', 'center', 'right', 'justify'],
      default: 'left'
    }
  };

  // Update setting for current device
  const updateSetting = (property, value) => {
    setSettings(prev => ({
      ...prev,
      [activeDevice]: {
        ...prev[activeDevice],
        [property]: value
      }
    }));

    // Apply to selected element
    if (selectedElement && editor) {
      const deviceClass = activeDevice !== 'desktop' ? `@media-${activeDevice}` : '';
      selectedElement.addStyle({ [property]: value }, { at: deviceClass });
    }
  };

  // Render property control
  const renderPropertyControl = (key, property) => {
    const currentValue = settings[activeDevice][key] || property.default;

    switch (property.type) {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => updateSetting(key, e.target.value)}
            className="property-select"
          >
            {property.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'slider':
        return (
          <div className="slider-control">
            <input
              type="range"
              min={property.min}
              max={property.max}
              value={currentValue}
              onChange={(e) => updateSetting(key, `${e.target.value}${property.unit}`)}
              className="property-slider"
            />
            <span className="slider-value">{currentValue}{property.unit}</span>
          </div>
        );

      case 'input':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateSetting(key, e.target.value)}
            className="property-input"
            placeholder={property.default}
          />
        );

      case 'spacing':
        return (
          <div className="spacing-control">
            {property.properties.map(side => (
              <div key={side} className="spacing-input">
                <label>{side}</label>
                <input
                  type="number"
                  value={currentValue[side] || 0}
                  onChange={(e) => updateSetting(key, {
                    ...currentValue,
                    [side]: e.target.value
                  })}
                  className="spacing-number"
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="responsive-settings-panel">
      <div className="panel-header">
        <h3>Responsive Settings</h3>
        <div className="device-tabs">
          {['desktop', 'tablet', 'mobile'].map(device => (
            <button
              key={device}
              className={`device-tab ${activeDevice === device ? 'active' : ''}`}
              onClick={() => setActiveDevice(device)}
            >
              {device === 'desktop' ? '🖥️' : device === 'tablet' ? '📱' : '📱'}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-content">
        {Object.entries(responsiveProperties).map(([key, property]) => (
          <div key={key} className="property-group">
            <label className="property-label">{property.label}</label>
            {renderPropertyControl(key, property)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveControls;