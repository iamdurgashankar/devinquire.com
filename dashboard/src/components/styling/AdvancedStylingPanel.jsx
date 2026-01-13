import React, { useState, useEffect } from 'react';
import './AdvancedStylingPanel.css';

const AdvancedStylingPanel = ({ editor, selectedElement, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('layout');
  const [styles, setStyles] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Style categories and their properties
  const styleCategories = {
    layout: {
      label: 'Layout',
      icon: '📐',
      properties: {
        display: {
          label: 'Display',
          type: 'select',
          options: ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'],
          default: 'block'
        },
        position: {
          label: 'Position',
          type: 'select',
          options: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
          default: 'static'
        },
        width: {
          label: 'Width',
          type: 'unit-input',
          units: ['px', '%', 'em', 'rem', 'vw', 'auto'],
          default: 'auto'
        },
        height: {
          label: 'Height',
          type: 'unit-input',
          units: ['px', '%', 'em', 'rem', 'vh', 'auto'],
          default: 'auto'
        },
        zIndex: {
          label: 'Z-Index',
          type: 'number',
          min: -999,
          max: 999,
          default: 'auto'
        }
      }
    },
    spacing: {
      label: 'Spacing',
      icon: '📏',
      properties: {
        margin: {
          label: 'Margin',
          type: 'spacing-box',
          sides: ['top', 'right', 'bottom', 'left'],
          units: ['px', 'em', 'rem', '%'],
          default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }
        },
        padding: {
          label: 'Padding',
          type: 'spacing-box',
          sides: ['top', 'right', 'bottom', 'left'],
          units: ['px', 'em', 'rem', '%'],
          default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }
        }
      }
    },
    typography: {
      label: 'Typography',
      icon: '🔤',
      properties: {
        fontFamily: {
          label: 'Font Family',
          type: 'select',
          options: [
            'inherit',
            'Arial, sans-serif',
            'Helvetica, sans-serif',
            'Georgia, serif',
            'Times New Roman, serif',
            'Courier New, monospace',
            'Verdana, sans-serif',
            'Trebuchet MS, sans-serif'
          ],
          default: 'inherit'
        },
        fontSize: {
          label: 'Font Size',
          type: 'unit-input',
          units: ['px', 'em', 'rem', '%'],
          default: '16px'
        },
        fontWeight: {
          label: 'Font Weight',
          type: 'select',
          options: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
          default: '400'
        },
        lineHeight: {
          label: 'Line Height',
          type: 'unit-input',
          units: ['px', 'em', 'rem', ''],
          default: '1.4'
        },
        letterSpacing: {
          label: 'Letter Spacing',
          type: 'unit-input',
          units: ['px', 'em', 'rem'],
          default: '0px'
        },
        textAlign: {
          label: 'Text Align',
          type: 'button-group',
          options: [
            { value: 'left', icon: '⬅️' },
            { value: 'center', icon: '↔️' },
            { value: 'right', icon: '➡️' },
            { value: 'justify', icon: '📄' }
          ],
          default: 'left'
        },
        textTransform: {
          label: 'Text Transform',
          type: 'select',
          options: ['none', 'uppercase', 'lowercase', 'capitalize'],
          default: 'none'
        },
        textDecoration: {
          label: 'Text Decoration',
          type: 'select',
          options: ['none', 'underline', 'overline', 'line-through'],
          default: 'none'
        }
      }
    },
    colors: {
      label: 'Colors',
      icon: '🎨',
      properties: {
        color: {
          label: 'Text Color',
          type: 'color',
          default: '#333333'
        },
        backgroundColor: {
          label: 'Background Color',
          type: 'color',
          default: 'transparent'
        },
        backgroundImage: {
          label: 'Background Image',
          type: 'background-image',
          default: 'none'
        },
        backgroundSize: {
          label: 'Background Size',
          type: 'select',
          options: ['auto', 'cover', 'contain', 'custom'],
          default: 'auto'
        },
        backgroundPosition: {
          label: 'Background Position',
          type: 'select',
          options: ['left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom'],
          default: 'center center'
        },
        backgroundRepeat: {
          label: 'Background Repeat',
          type: 'select',
          options: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'],
          default: 'no-repeat'
        }
      }
    },
    border: {
      label: 'Border',
      icon: '🔲',
      properties: {
        borderWidth: {
          label: 'Border Width',
          type: 'spacing-box',
          sides: ['top', 'right', 'bottom', 'left'],
          units: ['px'],
          default: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' }
        },
        borderStyle: {
          label: 'Border Style',
          type: 'select',
          options: ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
          default: 'solid'
        },
        borderColor: {
          label: 'Border Color',
          type: 'color',
          default: '#000000'
        },
        borderRadius: {
          label: 'Border Radius',
          type: 'spacing-box',
          sides: ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
          units: ['px', '%'],
          default: { 'top-left': 0, 'top-right': 0, 'bottom-right': 0, 'bottom-left': 0, unit: 'px' }
        }
      }
    },
    effects: {
      label: 'Effects',
      icon: '✨',
      properties: {
        boxShadow: {
          label: 'Box Shadow',
          type: 'shadow',
          default: 'none'
        },
        textShadow: {
          label: 'Text Shadow',
          type: 'shadow',
          default: 'none'
        },
        opacity: {
          label: 'Opacity',
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.1,
          default: 1
        },
        transform: {
          label: 'Transform',
          type: 'transform',
          properties: ['rotate', 'scaleX', 'scaleY', 'translateX', 'translateY'],
          default: { rotate: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 }
        },
        filter: {
          label: 'Filters',
          type: 'filter',
          properties: ['blur', 'brightness', 'contrast', 'grayscale', 'hue-rotate', 'saturate'],
          default: { blur: 0, brightness: 100, contrast: 100, grayscale: 0, 'hue-rotate': 0, saturate: 100 }
        }
      }
    },
    animation: {
      label: 'Animation',
      icon: '🎬',
      properties: {
        transition: {
          label: 'Transition',
          type: 'transition',
          default: 'none'
        },
        animationName: {
          label: 'Animation',
          type: 'select',
          options: ['none', 'fadeIn', 'fadeOut', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown', 'bounce', 'pulse', 'shake'],
          default: 'none'
        },
        animationDuration: {
          label: 'Duration',
          type: 'unit-input',
          units: ['s', 'ms'],
          default: '1s'
        },
        animationDelay: {
          label: 'Delay',
          type: 'unit-input',
          units: ['s', 'ms'],
          default: '0s'
        },
        animationIterationCount: {
          label: 'Iteration Count',
          type: 'select',
          options: ['1', '2', '3', 'infinite'],
          default: '1'
        }
      }
    }
  };

  // Update style value
  const updateStyle = (property, value) => {
    setStyles(prev => ({ ...prev, [property]: value }));
    
    if (selectedElement && editor) {
      selectedElement.addStyle({ [property]: value });
      editor.trigger('component:update', selectedElement);
    }
  };

  // Get current style value
  const getStyleValue = (property) => {
    if (selectedElement) {
      return selectedElement.getStyle()[property] || styles[property];
    }
    return styles[property];
  };

  // Render property control based on type
  const renderPropertyControl = (key, property) => {
    const currentValue = getStyleValue(key) || property.default;

    switch (property.type) {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => updateStyle(key, e.target.value)}
            className="style-select"
          >
            {property.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'unit-input':
        return (
          <div className="unit-input-control">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updateStyle(key, e.target.value)}
              className="unit-input"
            />
            <select
              className="unit-select"
              onChange={(e) => {
                const numValue = parseFloat(currentValue) || 0;
                updateStyle(key, `${numValue}${e.target.value}`);
              }}
            >
              {property.units.map(unit => (
                <option key={unit} value={unit}>{unit || 'none'}</option>
              ))}
            </select>
          </div>
        );

      case 'color':
        return (
          <div className="color-control">
            <input
              type="color"
              value={currentValue}
              onChange={(e) => updateStyle(key, e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updateStyle(key, e.target.value)}
              className="color-input"
              placeholder="#000000"
            />
          </div>
        );

      case 'slider':
        return (
          <div className="slider-control">
            <input
              type="range"
              min={property.min}
              max={property.max}
              step={property.step || 1}
              value={currentValue}
              onChange={(e) => updateStyle(key, e.target.value)}
              className="style-slider"
            />
            <span className="slider-value">{currentValue}</span>
          </div>
        );

      case 'button-group':
        return (
          <div className="button-group">
            {property.options.map(option => (
              <button
                key={option.value}
                className={`group-btn ${currentValue === option.value ? 'active' : ''}`}
                onClick={() => updateStyle(key, option.value)}
                title={option.value}
              >
                {option.icon}
              </button>
            ))}
          </div>
        );

      case 'spacing-box':
        return (
          <SpacingBoxControl
            value={currentValue}
            sides={property.sides}
            units={property.units}
            onChange={(value) => updateStyle(key, value)}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateStyle(key, e.target.value)}
            className="style-input"
          />
        );
    }
  };

  // Load styles from selected element
  useEffect(() => {
    if (selectedElement) {
      const elementStyles = selectedElement.getStyle();
      setStyles(elementStyles);
    }
  }, [selectedElement]);

  if (!isVisible) return null;

  return (
    <div className={`advanced-styling-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🎨</span>
          <h3>Style Panel</h3>
        </div>
        <div className="panel-actions">
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '📖' : '📕'}
          </button>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Style Tabs */}
          <div className="style-tabs">
            {Object.entries(styleCategories).map(([key, category]) => (
              <button
                key={key}
                className={`style-tab ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
                title={category.label}
              >
                <span className="tab-icon">{category.icon}</span>
                <span className="tab-label">{category.label}</span>
              </button>
            ))}
          </div>

          {/* Style Properties */}
          <div className="style-content">
            <div className="style-section">
              <h4 className="section-title">
                {styleCategories[activeTab].icon} {styleCategories[activeTab].label}
              </h4>
              
              <div className="properties-list">
                {Object.entries(styleCategories[activeTab].properties).map(([key, property]) => (
                  <div key={key} className="property-item">
                    <label className="property-label">{property.label}</label>
                    <div className="property-control">
                      {renderPropertyControl(key, property)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button
              className="action-btn"
              onClick={() => {
                if (selectedElement) {
                  selectedElement.set('style', {});
                  setStyles({});
                }
              }}
              title="Reset Styles"
            >
              🔄 Reset
            </button>
            <button
              className="action-btn"
              onClick={() => {
                const styleString = JSON.stringify(styles, null, 2);
                navigator.clipboard.writeText(styleString);
              }}
              title="Copy Styles"
            >
              📋 Copy
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Spacing Box Control Component
const SpacingBoxControl = ({ value, sides, units, onChange }) => {
  const [isLinked, setIsLinked] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(value?.unit || units[0]);

  const handleValueChange = (side, newValue) => {
    if (isLinked) {
      const linkedValue = {};
      sides.forEach(s => {
        linkedValue[s] = newValue;
      });
      onChange({ ...linkedValue, unit: selectedUnit });
    } else {
      onChange({ ...value, [side]: newValue, unit: selectedUnit });
    }
  };

  return (
    <div className="spacing-box-control">
      <div className="spacing-header">
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="unit-selector"
        >
          {units.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <button
          className={`link-btn ${isLinked ? 'linked' : ''}`}
          onClick={() => setIsLinked(!isLinked)}
          title={isLinked ? 'Unlink values' : 'Link values'}
        >
          {isLinked ? '🔗' : '🔓'}
        </button>
      </div>
      
      <div className="spacing-inputs">
        {sides.map(side => (
          <div key={side} className="spacing-input">
            <label>{side.replace('-', ' ')}</label>
            <input
              type="number"
              value={value?.[side] || 0}
              onChange={(e) => handleValueChange(side, e.target.value)}
              className="spacing-number"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedStylingPanel;