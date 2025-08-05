import React, { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import basicBlocks from 'grapesjs-blocks-basic';
import formsPlugin from 'grapesjs-plugin-forms';
import flexboxBlocks from 'grapesjs-blocks-flexbox';
import exportPlugin from 'grapesjs-plugin-export';
import tabsPlugin from 'grapesjs-tabs';
import customCodePlugin from 'grapesjs-custom-code';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { savePageOrder } from '../services/api';

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 z-[9999] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-base animate-fade-in-up">
      {message}
    </div>
  );
}

function RenameModal({ open, currentId, currentTitle, onRename, onClose, existingIds }) {
  const [idValue, setIdValue] = useState(currentId || '');
  const [titleValue, setTitleValue] = useState(currentTitle || '');
  const [error, setError] = useState('');
  useEffect(() => { setIdValue(currentId || ''); setTitleValue(currentTitle || ''); setError(''); }, [currentId, currentTitle, open]);
  if (!open) return null;
  const handleRename = () => {
    if (!idValue.trim()) return setError('ID required');
    if (existingIds.includes(idValue.trim()) && idValue.trim() !== currentId) return setError('ID already exists');
    onRename(idValue.trim(), titleValue.trim());
  };
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs">
        <h2 className="text-lg font-bold mb-4">Rename Page</h2>
        <input
          className="input-primary mb-2"
          value={idValue}
          onChange={e => { setIdValue(e.target.value); setError(''); }}
          autoFocus
          placeholder="Page ID"
        />
        <input
          className="input-primary mb-2"
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          placeholder="Page Title (optional)"
        />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleRename} disabled={!idValue.trim()}>Rename</button>
        </div>
      </div>
    </div>
  );
}

function OnboardingModal({ open, onClose }) {
  return open ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in-up">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close help modal"
        >&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Welcome to the Devinquire Page Builder!</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 text-base mb-4">
          <li><b>Create or select a page</b> from the sidebar to start editing. Use the "+" button to add a new page.</li>
          <li><b>Drag and drop</b> pages to reorder them. Click the save button to persist the order.</li>
          <li><b>Edit page content visually</b> using the builder on the right. Drag blocks from the left panel (in the editor) to build your page.</li>
          <li><b>Publish</b> your changes using the "Publish" button at the top right.</li>
          <li>Use the <b>Trash</b> section to restore or permanently delete pages.</li>
          <li>Access this help anytime by clicking the <b>?</b> button in the sidebar header.</li>
        </ul>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  ) : null;
}

function UnsavedChangesModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in-up">
        <h2 className="text-xl font-bold mb-4 text-red-700">Unsaved Changes</h2>
        <p className="mb-6 text-gray-700">You have unsaved changes. Are you sure you want to leave? Unsaved changes will be lost.</p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Leave Anyway</button>
        </div>
      </div>
    </div>
  );
}

const ItemTypes = { PAGE: 'page' };

// Add a simple Tooltip component
function Tooltip({ children, label }) {
  return (
    <span className="relative group">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block group-focus:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg opacity-90 transition-all duration-150">
        {label}
      </span>
    </span>
  );
}

function DraggablePage({ page, index, movePage, selected, onSelect, onRename, onDuplicate, onDelete, actionLoading }) {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.PAGE,
    hover(item) {
      if (item.index === index) return;
      movePage(item.index, index);
      item.index = index;
    },
  });
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.PAGE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <li
      ref={ref}
      className={`flex items-center justify-between py-2 group transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: 'move' }}
    >
      <span
        className={`mr-2 text-gray-400 cursor-move select-none`}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="19" cy="6" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="19" cy="18" r="1.5"/></svg>
      </span>
      <button
        className={`text-left flex-1 px-2 py-1 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'bg-gradient-to-r from-blue-200/80 to-purple-200/80 text-blue-900 shadow-lg scale-105' : 'hover:bg-blue-50 hover:scale-105'}`}
        onClick={onSelect}
        disabled={actionLoading}
        aria-label={`Select page ${page.id}`}
      >{page.title || page.id}</button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
        <Tooltip label="Rename">
          <button
            className="p-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-900 transition-colors"
            aria-label={`Rename page ${page.id}`}
            onClick={onRename}
            disabled={actionLoading}
          >✏️</button>
        </Tooltip>
        <Tooltip label="Duplicate">
          <button
            className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-900 transition-colors"
            aria-label={`Duplicate page ${page.id}`}
            onClick={onDuplicate}
            disabled={actionLoading}
          >📄</button>
        </Tooltip>
        <Tooltip label="Delete">
          <button
            className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-900 transition-colors"
            aria-label={`Delete page ${page.id}`}
            onClick={onDelete}
            disabled={actionLoading}
          >🗑️</button>
        </Tooltip>
      </div>
    </li>
  );
}

function PreviewModal({ open, html, css, onClose }) {
  if (!open) return null;
  // Compose a full HTML document for the iframe
  const doc = `<!DOCTYPE html><html><head><style>${css || ''}</style></head><body>${html || ''}</body></html>`;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl w-full relative animate-fade-in-up flex flex-col" style={{height: '80vh'}}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none z-10"
          onClick={onClose}
          aria-label="Close preview modal"
        >&times;</button>
        <h2 className="text-lg font-bold mb-4 text-blue-700">Page Preview</h2>
        <iframe
          title="Page Preview"
          srcDoc={doc}
          className="flex-1 w-full rounded-xl border border-gray-200 shadow-inner bg-white"
          style={{minHeight: '60vh', background: 'white'}}
        />
      </div>
    </div>
  );
}

// Helper to register custom blocks and components
function registerCustomBlocks(editor) {
  // Define block categories
  const blockCategories = {
    layout: 'Layout Blocks',
    sections: 'Content Sections',
    navigation: 'Navigation',
    elements: 'UI Elements',
    forms: 'Form Elements',
    interactive: 'Interactive',
    content: 'Content Blocks'
  };

  // Register basic components first
  editor.DomComponents.addType('section-block', {
    model: {
      defaults: {
        tagName: 'section',
        draggable: true,
        droppable: true,
        attributes: { class: 'block-section' },
        traits: [
          {
            type: 'class_select',
            options: [
              { value: 'bg-white', name: 'Light' },
              { value: 'bg-gray-100', name: 'Gray' },
              { value: 'bg-blue-500', name: 'Blue' },
              { value: 'bg-gradient-to-r from-blue-500 to-purple-500', name: 'Gradient' }
            ],
            label: 'Background'
          },
          {
            type: 'class_select',
            options: [
              { value: 'py-8', name: 'Small' },
              { value: 'py-16', name: 'Medium' },
              { value: 'py-24', name: 'Large' }
            ],
            label: 'Padding'
          }
        ]
      }
    }
  });
  // Example: Hero Section
  editor.BlockManager.add('custom-hero', {
    label: 'Hero Section',
    category: 'Sections',
    attributes: { class: 'gjs-block-section' },
    content: `
      <section class="py-16 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold mb-4">Your Headline Here</h1>
        <p class="text-lg mb-6">A short description for your hero section. Make it catchy!</p>
        <a href="#" class="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-50 transition">Get Started</a>
      </section>
    `,
  });
  // Example: Testimonial
  editor.BlockManager.add('custom-testimonial', {
    label: 'Testimonial',
    category: 'Sections',
    content: `
      <div class="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <img src="https://randomuser.me/api/portraits/men/32.jpg" class="w-16 h-16 rounded-full mb-4" alt="User" />
        <blockquote class="italic text-gray-700 mb-2">“This is the best service I’ve ever used!”</blockquote>
        <span class="font-semibold text-blue-600">John Doe</span>
      </div>
    `,
  });
  // Example: Pricing Table
  editor.BlockManager.add('custom-pricing', {
    label: 'Pricing Table',
    category: 'Sections',
    content: `
      <div class="flex flex-col md:flex-row gap-6 justify-center">
        <div class="bg-white rounded-xl shadow-lg p-8 flex-1">
          <h3 class="text-xl font-bold mb-2">Basic</h3>
          <div class="text-3xl font-extrabold mb-4">$19/mo</div>
          <ul class="mb-6 text-gray-600"><li>Feature 1</li><li>Feature 2</li></ul>
          <a href="#" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Choose</a>
        </div>
        <div class="bg-blue-600 text-white rounded-xl shadow-lg p-8 flex-1">
          <h3 class="text-xl font-bold mb-2">Pro</h3>
          <div class="text-3xl font-extrabold mb-4">$49/mo</div>
          <ul class="mb-6"><li>Everything in Basic</li><li>Pro Feature</li></ul>
          <a href="#" class="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold">Choose</a>
        </div>
      </div>
    `,
  });
  // Navigation Blocks
  const navigationBlocks = {
    navbar: {
      label: 'Navigation Bar',
      content: `
        <nav class="bg-white shadow-lg">
          <div class="container mx-auto px-4">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center">
                <a href="#" class="text-xl font-bold text-blue-600">Logo</a>
              </div>
              <div class="hidden md:flex space-x-8">
                <a href="#" class="text-gray-700 hover:text-blue-600 transition">Home</a>
                <a href="#" class="text-gray-700 hover:text-blue-600 transition">About</a>
                <a href="#" class="text-gray-700 hover:text-blue-600 transition">Services</a>
                <a href="#" class="text-gray-700 hover:text-blue-600 transition">Contact</a>
              </div>
              <button class="md:hidden">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </nav>
      `
    },
    footer: {
      label: 'Footer',
      content: `
        <footer class="bg-gray-900 text-white py-12">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">About Us</h3>
                <p class="text-gray-400">A brief description of your company or website.</p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white transition">Home</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white transition">Services</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Contact</h3>
                <ul class="space-y-2 text-gray-400">
                  <li>Email: info@example.com</li>
                  <li>Phone: (123) 456-7890</li>
                  <li>Address: 123 Street Name</li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Follow Us</h3>
                <div class="flex space-x-4">
                  <a href="#" class="text-gray-400 hover:text-white transition">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" class="text-gray-400 hover:text-white transition">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" class="text-gray-400 hover:text-white transition">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; 2025 Your Company. All rights reserved.</p>
            </div>
          </div>
        </footer>
      `
    }
  };

  // Content Blocks
  const contentBlocks = {
    textContent: {
      label: 'Text Content',
      content: `
        <div class="prose lg:prose-xl mx-auto py-8">
          <h2>Section Title</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <ul>
            <li>Feature point one</li>
            <li>Feature point two</li>
            <li>Feature point three</li>
          </ul>
        </div>
      `
    },
    imageText: {
      label: 'Image with Text',
      content: `
        <div class="grid md:grid-cols-2 gap-8 items-center py-12">
          <div class="space-y-4">
            <h2 class="text-3xl font-bold">Section Title</h2>
            <p class="text-gray-600">A detailed description of your content goes here. Make it engaging and informative.</p>
            <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Learn More</button>
          </div>
          <div class="relative h-64 overflow-hidden rounded-xl">
            <img src="https://source.unsplash.com/random/800x600" alt="Content Image" class="absolute inset-0 w-full h-full object-cover"/>
          </div>
        </div>
      `
    }
  };

  // Interactive Elements
  const interactiveBlocks = {
    accordion: {
      label: 'Accordion',
      content: `
        <div class="space-y-2" data-gjs-type="accordion">
          <div class="border rounded-lg">
            <button class="w-full px-4 py-3 text-left font-semibold flex justify-between items-center">
              <span>Accordion Item 1</span>
              <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="px-4 pb-3 hidden">
              <p class="text-gray-600">Content for accordion item 1 goes here.</p>
            </div>
          </div>
          <div class="border rounded-lg">
            <button class="w-full px-4 py-3 text-left font-semibold flex justify-between items-center">
              <span>Accordion Item 2</span>
              <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="px-4 pb-3 hidden">
              <p class="text-gray-600">Content for accordion item 2 goes here.</p>
            </div>
          </div>
        </div>
      `
    },
    tabs: {
      label: 'Tabs',
      content: `
        <div class="tabs-container">
          <div class="flex border-b">
            <button class="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Tab 1</button>
            <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Tab 2</button>
            <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Tab 3</button>
          </div>
          <div class="p-4">
            <div>Content for tab 1</div>
            <div class="hidden">Content for tab 2</div>
            <div class="hidden">Content for tab 3</div>
          </div>
        </div>
      `
    },
    modal: {
      label: 'Modal Button',
      content: `
        <div class="text-center">
          <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" onclick="document.getElementById('modal').classList.remove('hidden')">
            Open Modal
          </button>
          <div id="modal" class="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 items-center justify-center hidden">
            <div class="bg-white rounded-xl p-8 max-w-md mx-auto relative">
              <button class="absolute top-4 right-4 text-gray-600 hover:text-gray-800" onclick="this.closest('#modal').classList.add('hidden')">&times;</button>
              <h3 class="text-xl font-bold mb-4">Modal Title</h3>
              <p class="text-gray-600 mb-6">Modal content goes here. You can put any content you want.</p>
              <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" onclick="this.closest('#modal').classList.add('hidden')">
                Close
              </button>
            </div>
          </div>
        </div>
      `
    }
  };

  // Form Elements
  const formElements = {
    input: {
      label: 'Text Input',
      content: '<input type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter text">'
    },
    textarea: {
      label: 'Text Area', 
      content: '<textarea class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Enter text"></textarea>'
    },
    button: {
      label: 'Button',
      content: '<button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Button</button>'
    },
    contactForm: {
      label: 'Contact Form',
      content: `
        <form class="max-w-lg mx-auto space-y-4 p-6 bg-white rounded-xl shadow-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Your message"></textarea>
          </div>
          <button type="submit" class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Send Message</button>
        </form>
      `
    }
  };

  // Register navigation blocks
  Object.entries(navigationBlocks).forEach(([key, block]) => {
    editor.BlockManager.add(`nav-${key}`, {
      label: block.label,
      category: blockCategories.navigation,
      content: block.content,
      attributes: { class: 'gjs-block-full-width' }
    });
  });

  // Register content blocks
  Object.entries(contentBlocks).forEach(([key, block]) => {
    editor.BlockManager.add(`content-${key}`, {
      label: block.label,
      category: blockCategories.content,
      content: block.content
    });
  });

  // Register interactive blocks
  Object.entries(interactiveBlocks).forEach(([key, block]) => {
    editor.BlockManager.add(`interactive-${key}`, {
      label: block.label,
      category: blockCategories.interactive,
      content: block.content
    });
  });

  // Register form elements
  Object.entries(formElements).forEach(([key, element]) => {
    editor.BlockManager.add(`form-${key}`, {
      label: element.label,
      category: blockCategories.forms,
      content: element.content
    });
  });

  // Add styles panel
  editor.Panels.addPanel({
    id: 'styles-panel',
    visible: true,
    buttons: [
      {
        id: 'visibility',
        active: true,
        className: 'btn-toggle-borders',
        label: '<i class="fa fa-square-o"></i>',
        command: 'sw-visibility'
      }
    ]
  });
}

function TemplatesModal({ open, onClose, onInsert }) {
  if (!open) return null;
  const templates = [
    {
      name: 'Landing Page',
      html: `<section class='py-16 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex flex-col items-center justify-center'><h1 class='text-4xl font-bold mb-4'>Welcome to Devinquire</h1><p class='text-lg mb-6'>Build beautiful pages with ease.</p><a href='#' class='bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-50 transition'>Get Started</a></section><section class='py-12 px-8 bg-white text-gray-800 rounded-2xl mt-8'><h2 class='text-2xl font-bold mb-4'>Features</h2><div class='grid grid-cols-1 md:grid-cols-3 gap-6'><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>🚀</div><h4 class='font-bold mb-2'>Fast</h4><p class='text-gray-600 text-center'>Super fast performance for your site.</p></div><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>🔒</div><h4 class='font-bold mb-2'>Secure</h4><p class='text-gray-600 text-center'>Top-notch security for your data.</p></div><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>💡</div><h4 class='font-bold mb-2'>Innovative</h4><p class='text-gray-600 text-center'>Cutting-edge features and design.</p></div></div></section>`
    },
    {
      name: 'About Section',
      html: `<section class='py-16 px-8 bg-white text-gray-800 rounded-2xl flex flex-col items-center justify-center'><h2 class='text-3xl font-bold mb-4'>About Us</h2><p class='text-lg mb-6 max-w-xl text-center'>We are passionate about building modern, user-friendly web experiences. Our team is dedicated to your success.</p></section>`
    },
    {
      name: 'Contact Section',
      html: `<section class='py-16 px-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl flex flex-col items-center justify-center'><h2 class='text-3xl font-bold mb-4'>Contact Us</h2><form class='w-full max-w-md'><input class='w-full mb-4 px-4 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80' placeholder='Your Name' /><input class='w-full mb-4 px-4 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80' placeholder='Your Email' /><textarea class='w-full mb-4 px-4 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80' placeholder='Your Message'></textarea><button class='bg-white text-purple-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-purple-50 transition w-full'>Send Message</button></form></section>`
    },
    {
      name: 'Hero Section',
      html: `<section class='py-16 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex flex-col items-center justify-center'><h1 class='text-4xl font-bold mb-4'>Your Headline Here</h1><p class='text-lg mb-6'>A short description for your hero section. Make it catchy!</p><a href='#' class='bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-50 transition'>Get Started</a></section>`
    },
    {
      name: 'Features Grid',
      html: `<section class='py-12 px-8 bg-white text-gray-800 rounded-2xl'><h2 class='text-2xl font-bold mb-4'>Features</h2><div class='grid grid-cols-1 md:grid-cols-3 gap-6'><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>🚀</div><h4 class='font-bold mb-2'>Fast</h4><p class='text-gray-600 text-center'>Super fast performance for your site.</p></div><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>🔒</div><h4 class='font-bold mb-2'>Secure</h4><p class='text-gray-600 text-center'>Top-notch security for your data.</p></div><div class='bg-blue-50 rounded-xl p-6 flex flex-col items-center'><div class='w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4'>💡</div><h4 class='font-bold mb-2'>Innovative</h4><p class='text-gray-600 text-center'>Cutting-edge features and design.</p></div></div></section>`
    },
    {
      name: 'Pricing Table',
      html: `<section class='py-12 px-8 bg-white text-gray-800 rounded-2xl'><h2 class='text-2xl font-bold mb-4'>Pricing</h2><div class='flex flex-col md:flex-row gap-6 justify-center'><div class='bg-white rounded-xl shadow-lg p-8 flex-1'><h3 class='text-xl font-bold mb-2'>Basic</h3><div class='text-3xl font-extrabold mb-4'>$19/mo</div><ul class='mb-6 text-gray-600'><li>Feature 1</li><li>Feature 2</li></ul><a href='#' class='bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold'>Choose</a></div><div class='bg-blue-600 text-white rounded-xl shadow-lg p-8 flex-1'><h3 class='text-xl font-bold mb-2'>Pro</h3><div class='text-3xl font-extrabold mb-4'>$49/mo</div><ul class='mb-6'><li>Everything in Basic</li><li>Pro Feature</li></ul><a href='#' class='bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold'>Choose</a></div></div></section>`
    },
    {
      name: 'Testimonial',
      html: `<section class='py-12 px-8 bg-white text-gray-800 rounded-2xl flex flex-col items-center'><div class='bg-white rounded-xl shadow-lg p-8 flex flex-col items-center'><img src='https://randomuser.me/api/portraits/men/32.jpg' class='w-16 h-16 rounded-full mb-4' alt='User' /><blockquote class='italic text-gray-700 mb-2'>“This is the best service I’ve ever used!”</blockquote><span class='font-semibold text-blue-600'>John Doe</span></div></section>`
    }
  ];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative animate-fade-in-up">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close templates modal"
        >&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Templates Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(tpl => (
            <div key={tpl.name} className="bg-blue-50 rounded-xl p-4 flex flex-col items-center shadow hover:shadow-lg transition cursor-pointer group">
              <span className="font-semibold text-blue-700 mb-2">{tpl.name}</span>
              <button
                className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition"
                onClick={() => { onInsert(tpl.html); onClose(); }}
              >Insert</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DevicePreviewDropdown({ previewDevice, setPreviewDevice }) {
  const [open, setOpen] = React.useState(false);
  const devices = [
    {
      name: 'Desktop',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/></svg>
      ),
    },
    {
      name: 'Tablet',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="17" r="1"/></svg>
      ),
    },
    {
      name: 'Mobile',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>
      ),
    },
  ];
  const current = devices.find(d => d.name === previewDevice) || devices[0];
  return (
    <div className="relative">
      <button
        className="flex items-center px-3 py-1 rounded-lg font-semibold text-xs border bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        type="button"
      >
        {current.icon}
        <span className="mr-1">{current.name}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <ul className="absolute left-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in-up" role="listbox">
          {devices.map(device => (
            <li
              key={device.name}
              className={`flex items-center px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 transition ${previewDevice === device.name ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}
              onClick={() => { setPreviewDevice(device.name); setOpen(false); }}
              role="option"
              aria-selected={previewDevice === device.name}
            >
              {device.icon}
              {device.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PageBuilder() {
  const editorRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [trash, setTrash] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [newPageId, setNewPageId] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingPageContent, setLoadingPageContent] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [renameId, setRenameId] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const navigate = useNavigate();

  // Add position/order support
  const [pageOrder, setPageOrder] = useState([]);
  useEffect(() => {
    setPageOrder(pages.map(p => p.id));
  }, [pages]);

  // Move page in order
  const movePage = useCallback((from, to) => {
    setPageOrder((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      return updated;
    });
  }, []);

  // Persist order to backend (optional, if you want to save order)
  const [savingOrder, setSavingOrder] = useState(false);
  const persistOrder = async () => {
    setSavingOrder(true);
    try {
      await savePageOrder(pageOrder);
      showToast('Page order saved!');
      fetchPages();
    } catch (e) {
      showToast('Failed to save page order');
    }
    setSavingOrder(false);
  };

  // Import required functions from pageApi
  const { getPage, createPage, savePage, deletePage, renamePage, duplicatePage, restorePage } = require('../services/pageApi');

  // Create new page
  const handleCreatePage = async () => {
    if (!newPageId.trim()) {
      showToast('Please enter a page ID');
      return;
    }

    if (pages.some(p => p.id === newPageId.trim())) {
      showToast('Page ID already exists');
      return;
    }

    setActionLoading(true);
    try {
      const result = await createPage({
        id: newPageId.trim(),
        title: newPageTitle.trim() || newPageId.trim(),
        content: {
          html: '<div>New Page Content</div>',
          css: 'body { margin: 0; padding: 20px; }'
        },
        order: pages.length // Add at the end
      });

      if (result.success) {
        showToast('Page created successfully!');
        setNewPageId('');
        setNewPageTitle('');
        await fetchPages();
        setSelectedPageId(newPageId.trim());
      } else {
        throw new Error(result.message || 'Failed to create page');
      }
    } catch (err) {
      console.error('Error creating page:', err);
      showToast('Failed to create page: ' + (err.message || 'Please try again'));
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch all pages for sidebar
  const fetchPages = async () => {
    setLoadingPages(true);
    setError('');
    try {
      const [activePages, deletedPages] = await Promise.all([
        getPage(),
        getPage(null, true)
      ]);

      // Handle active pages
      if (activePages.success && Array.isArray(activePages.pages)) {
        const sortedPages = activePages.pages.sort((a, b) => 
          (a.order || Number.MAX_SAFE_INTEGER) - (b.order || Number.MAX_SAFE_INTEGER)
        );
        setPages(sortedPages);
        
        // Auto-select first page if none selected
        if (!selectedPageId && sortedPages.length > 0) {
          setSelectedPageId(sortedPages[0].id);
        }

        // Update page order
        setPageOrder(sortedPages.map(p => p.id));
      } else {
        console.error('Invalid active pages response:', activePages);
        setError('Failed to load pages. Invalid data format.');
      }

      // Handle deleted pages
      if (deletedPages.success && Array.isArray(deletedPages.pages)) {
        setTrash(deletedPages.pages);
      } else {
        console.error('Invalid deleted pages response:', deletedPages);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err?.message || 'Failed to load pages. Please check your connection.');
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line
  }, []);

  const [unsaved, setUnsaved] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingNav = useRef(null);

  // Only re-initialize editor if selectedPageId changes
  useEffect(() => {
    if (!selectedPageId) return;
    setLoadingPageContent(true);
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }
    const editor = grapesjs.init({
      container: '#gjs',
      width: '100vw',
      height: '100vh',
      storageManager: false,
      plugins: [
        basicBlocks,
        formsPlugin,
        flexboxBlocks,
        exportPlugin,
        tabsPlugin,
        customCodePlugin,
      ],
      pluginsOpts: {
        [basicBlocks]: {},
        [formsPlugin]: {},
        [flexboxBlocks]: {},
        [exportPlugin]: {},
        [tabsPlugin]: {},
        [customCodePlugin]: {},
      },
      blockManager: {
        appendTo: '#gjs-blocks', // For custom block panel if needed
      },
    });
    // Register custom blocks
    registerCustomBlocks(editor);
    fetch(`/api/get_page.php?id=${selectedPageId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.html) {
          editor.setComponents(data.html);
          if (data.css) editor.setStyle(data.css);
        }
        setLoadingPageContent(false);
        setUnsaved(false); // Reset unsaved state on load
        // Focus editor after loading
        setTimeout(() => {
          const frame = document.querySelector('#gjs iframe');
          if (frame) frame.contentWindow.focus();
        }, 500);
      })
      .catch(() => setLoadingPageContent(false));
    editor.on('component:add component:remove component:update style:propertychange', () => {
      setUnsaved(true);
    });
    editorRef.current = editor;
    // Block search and category filtering
    editor.on('block:drag:start', () => {
      // Close search panel if needed
    });
    editor.on('block:drag:stop', () => {
      // Reopen search panel if needed
    });
    // Filter blocks in real time
    const filterBlocks = () => {
      const search = blockSearch.toLowerCase();
      editor.BlockManager.getAll().forEach(block => {
        const matchesSearch = !search || block.get('label').toLowerCase().includes(search);
        const matchesCategory = blockCategory === 'All' || block.get('category') === blockCategory;
        const el = block.view?.el;
        if (el) {
          el.style.display = matchesSearch && matchesCategory ? '' : 'none';
        }
      });
    };
    filterBlocks();
    // Listen for search/category changes
    const unsub1 = editor.on('block:add', filterBlocks);
    const unsub2 = editor.on('block:remove', filterBlocks);
    return () => {
      unsub1();
      unsub2();
    };
    // Clean up on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [selectedPageId]);

  // Warn on browser/tab close if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsaved]);

  // Intercept in-app navigation (Back to Admin)
  const handleBackToAdmin = () => {
    if (unsaved) {
      setShowUnsavedModal(true);
      pendingNav.current = () => navigate('/admin');
    } else {
      navigate('/admin');
    }
  };
  const confirmLeave = () => {
    setShowUnsavedModal(false);
    setUnsaved(false);
    if (pendingNav.current) {
      pendingNav.current();
      pendingNav.current = null;
    }
  };
  const cancelLeave = () => {
    setShowUnsavedModal(false);
    pendingNav.current = null;
  };

  const showToast = (msg) => {
    setToast(msg);
  };

  const handlePublish = async () => {
    if (!selectedPageId) return showToast('No page selected');
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    const res = await fetch('/api/save_page.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedPageId, html, css }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Page published!');
      setUnsaved(false);
    } else showToast('Error publishing page');
    fetchPages();
  };

  const handleCreate = async () => {
    const id = newPageId.trim();
    const title = newPageTitle.trim() || id;
    
    if (!id) {
      showToast('Enter a page ID');
      return;
    }
    
    if (pages.some(p => p.id === id) || trash.some(p => p.id === id)) {
      showToast('Page ID already exists');
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await createPage({
        id,
        title,
        content: {
          html: '<div class="container mx-auto px-4 py-8"><h1 class="text-3xl font-bold mb-4">New Page</h1><p>Start editing your page content here.</p></div>',
          css: 'body { margin: 0; padding: 0; }'
        }
      });

      if (result.success) {
        setSelectedPageId(id);
        setNewPageId('');
        setNewPageTitle('');
        await fetchPages();
        showToast('Page created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create page');
      }
    } catch (err) {
      console.error('Error creating page:', err);
      showToast(err.message || 'Failed to create page. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete page (soft)
  const handleDelete = async (id) => {
    if (!window.confirm(`Move page "${id}" to Trash?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/delete_page.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Page moved to Trash!');
        if (selectedPageId === id && pages.length > 1) {
          const next = pages.find(p => p.id !== id);
          setSelectedPageId(next ? next.id : (pages.length > 1 ? pages[0].id : ''));
        }
        fetchPages();
      } else {
        showToast('Failed to delete page.');
      }
    } catch {
      showToast('Failed to delete page.');
    }
    setActionLoading(false);
  };

  // Restore page
  const handleRestore = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/restore_page.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Page restored!');
        fetchPages();
      } else {
        showToast('Failed to restore page.');
      }
    } catch {
      showToast('Failed to restore page.');
    }
    setActionLoading(false);
  };

  // Permanent delete
  const handlePermanentDelete = async (id) => {
    if (!window.confirm(`Permanently delete page "${id}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/delete_page.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Page permanently deleted!');
        fetchPages();
      } else {
        showToast('Failed to delete page.');
      }
    } catch {
      showToast('Failed to delete page.');
    }
    setActionLoading(false);
  };

  // Duplicate page
  const handleDuplicate = async (id) => {
    const newId = window.prompt('Enter new page ID for duplicate:', id + '-copy');
    if (!newId || newId === id) return;
    if (pages.some(p => p.id === newId) || trash.some(p => p.id === newId)) return showToast('Page ID already exists');
    setActionLoading(true);
    try {
      const res = await fetch('/api/duplicate_page.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Page duplicated!');
        fetchPages();
      } else {
        showToast(data.message || 'Failed to duplicate page.');
      }
    } catch {
      showToast('Failed to duplicate page.');
    }
    setActionLoading(false);
  };

  // Rename page (open modal)
  const openRename = (id) => {
    const page = pages.find(p => p.id === id) || trash.find(p => p.id === id);
    setRenameId(id);
    setRenameTitle(page?.title || '');
    setShowRename(true);
  };
  const handleRename = async (newId, newTitle) => {
    setShowRename(false);
    if (!newId || newId === renameId) return;
    if (pages.some(p => p.id === newId) || trash.some(p => p.id === newId)) return showToast('Page ID already exists');
    setActionLoading(true);
    try {
      const res = await fetch('/api/rename_page.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldId: renameId, newId, newTitle }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Page renamed!');
        if (selectedPageId === renameId) setSelectedPageId(newId);
        fetchPages();
      } else {
        showToast(data.message || 'Failed to rename page.');
      }
    } catch {
      showToast('Failed to rename page.');
    }
    setActionLoading(false);
  };

  // Filtered pages in order
  const filteredPages = pageOrder
    .map(id => pages.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => p.id.toLowerCase().includes(search.toLowerCase()));
  const filteredTrash = trash.filter(p => p.id.toLowerCase().includes(search.toLowerCase()));

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');
  const [blockCategory, setBlockCategory] = useState('All');
  const blockCategories = ['All', 'Basic', 'Forms', 'Media', 'Sections', 'Layout', 'Advanced'];
  const [showTemplates, setShowTemplates] = useState(false);
  const handleInsertTemplate = html => {
    if (editorRef.current) {
      editorRef.current.setComponents(html);
      setUnsaved(true);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('pagebuilder_onboarding_seen')) {
      setShowOnboarding(true);
    }
  }, []);
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('pagebuilder_onboarding_seen', '1');
  };

  const [previewDevice, setPreviewDevice] = useState('Desktop');

  // Responsive device preview
  const setDevice = (device) => {
    if (!editorRef.current) return;
    if (device === 'Desktop') {
      editorRef.current.setDevice('Desktop');
      editorRef.current.Canvas.setWidth('100%');
    } else if (device === 'Tablet') {
      editorRef.current.setDevice('Tablet');
      editorRef.current.Canvas.setWidth('768px');
    } else if (device === 'Mobile') {
      editorRef.current.setDevice('Mobile');
      editorRef.current.Canvas.setWidth('375px');
    }
  };
  setDevice(previewDevice);

  // Add state for block panel collapse
  const [blockPanelOpen, setBlockPanelOpen] = useState(true);
  // Sidebar panel open/close logic
  const [sidebarOpen, setSidebarOpen] = useState(null); // Sidebar closed by default
  // Highlight active icon and allow toggling
  const handleSidebarToggle = (panel) => {
    setSidebarOpen((prev) => (prev === panel ? null : panel));
  };
  // ESC key closes sidebar panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 z-50 flex flex-row w-screen h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Slim vertical sidebar */}
        <nav className="w-16 flex flex-col items-center py-4 bg-white/90 border-r border-gray-200 shadow-lg z-20 relative">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          {/* Sidebar icons */}
          <button className={`mb-4 p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors ${sidebarOpen==='pages' ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`} title="Pages" aria-label="Pages" onClick={() => handleSidebarToggle('pages')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button className={`mb-4 p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors ${sidebarOpen==='add' ? 'bg-green-100 ring-2 ring-green-400' : ''}`} title="Add Page" aria-label="Add Page" onClick={() => handleSidebarToggle('add')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
          </button>
          <button className={`mb-4 p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors ${sidebarOpen==='trash' ? 'bg-red-100 ring-2 ring-red-400' : ''}`} title="Trash" aria-label="Trash" onClick={() => handleSidebarToggle('trash')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 002 2h2a2 2 0 002-2V6" /></svg>
          </button>
          <button className="mt-auto p-2 rounded-lg hover:bg-blue-100 text-blue-600" title="Help" aria-label="Help" onClick={() => setShowOnboarding(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
          </button>
          <button
            className="mb-3 mt-4 w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 text-blue-600 hover:text-purple-600 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-200 transform hover:scale-105"
            title="Back to Admin Dashboard"
            aria-label="Back to Admin Dashboard"
            onClick={handleBackToAdmin}
          >
            <svg className="w-5 h-5 mb-1 transform transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin</span>
          </button>
          {/* Block panel toggle arrow (now at the bottom of sidebar) */}
          <button
            className="mb-2 mt-4 bg-white border border-blue-100 shadow-xl rounded-full w-12 h-12 flex items-center justify-center focus:outline-none hover:bg-blue-100 transition-transform duration-200 group"
            onClick={() => setBlockPanelOpen(!blockPanelOpen)}
            aria-label={blockPanelOpen ? 'Collapse block panel' : 'Expand block panel'}
          >
            <span className="sr-only">{blockPanelOpen ? 'Collapse blocks' : 'Expand blocks'}</span>
            <svg
              className={`w-7 h-7 text-blue-600 transition-transform duration-300 ${blockPanelOpen ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              {blockPanelOpen ? (
                <>
                  <path d="M10 6l6 6-6 6" />
                  <path d="M6 6l6 6-6 6" />
                </>
              ) : (
                <>
                  <path d="M14 6l-6 6 6 6" />
                  <path d="M18 6l-6 6 6 6" />
                </>
              )}
            </svg>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block group-focus:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg opacity-90 transition-all duration-150">
              {blockPanelOpen ? 'Collapse blocks' : 'Expand blocks'}
            </span>
          </button>
        </nav>
        {/* Sidebar panel: only render if sidebarOpen is not null */}
        <div
          className={`fixed left-16 top-0 h-full z-30 transition-all duration-300 ${sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'} bg-white border-r border-gray-200 shadow-lg overflow-hidden`}
          style={{ transitionProperty: 'width, opacity' }}
        >
          {sidebarOpen && (
            <div className={`h-full flex flex-col transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
              tabIndex={sidebarOpen ? 0 : -1}
              aria-hidden={!sidebarOpen}
            >
              {sidebarOpen === 'pages' && (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-bold text-lg text-blue-700">Pages</span>
                    <button className="text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => handleSidebarToggle('pages')}>&times;</button>
                  </div>
                  {/* Page list and actions (reuse existing code) */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Pages</h3>
                    {loadingPages ? (
                      <div className="flex items-center gap-2 text-blue-600 font-semibold animate-pulse">
                        <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></span>
                        Loading...
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-start gap-2 text-red-600 font-semibold">
                        <span>{error}</span>
                        <button
                          className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm border border-blue-700 transition"
                          onClick={fetchPages}
                        >Retry</button>
                      </div>
                    ) : filteredPages.length === 0 ? (
                      <div className="py-2 text-gray-500">No pages found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100 custom-scrollbar">
                        {filteredPages.map((page, idx) => (
                          <DraggablePage
                            key={page.id}
                            page={page}
                            index={idx}
                            movePage={movePage}
                            selected={selectedPageId === page.id}
                            onSelect={() => setSelectedPageId(page.id)}
                            onRename={() => openRename(page.id)}
                            onDuplicate={() => handleDuplicate(page.id)}
                            onDelete={() => handleDelete(page.id)}
                            actionLoading={actionLoading}
                          />
                        ))}
                      </ul>
                    )}
                    {/* Save order button */}
                    {filteredPages.length > 1 && (
                      <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold shadow-sm border border-blue-700 transition" onClick={persistOrder} disabled={actionLoading || savingOrder}>
                        {savingOrder ? 'Saving...' : 'Save Order'}
                      </button>
                    )}
                    {/* Trash Section */}
                    <div className="mt-8">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trash</h3>
                      <ul className="divide-y divide-gray-100 custom-scrollbar">
                        {filteredTrash.length === 0 && <li className="py-2 text-gray-400">No deleted pages.</li>}
                        {filteredTrash.map(page => (
                          <li key={page.id} className="flex items-center justify-between py-2 group transition-all duration-200">
                            <span className="flex-1 px-2 py-1 text-left text-gray-400 line-through">{page.id}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                              <Tooltip label="Restore">
                                <button
                                  className="p-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-900 transition-colors"
                                  aria-label={`Restore page ${page.id}`}
                                  onClick={() => handleRestore(page.id)}
                                  disabled={actionLoading}
                                >♻️</button>
                              </Tooltip>
                              <Tooltip label="Delete Permanently">
                                <button
                                  className="p-1 rounded hover:bg-red-200 text-red-700 hover:text-red-900 transition-colors"
                                  aria-label={`Permanently delete page ${page.id}`}
                                  onClick={() => handlePermanentDelete(page.id)}
                                  disabled={actionLoading}
                                >🗑️</button>
                              </Tooltip>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {sidebarOpen === 'add' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-bold text-lg text-green-700">Add Page</span>
                    <button className="text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => handleSidebarToggle('add')}>&times;</button>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-blue-700 mb-2">Create a New Page</h3>
                      <p className="text-gray-500 text-sm mb-4">Enter a unique page ID (e.g. <span className='font-mono'>about</span>, <span className='font-mono'>services</span>) and an optional title. The ID will be used in the URL and must be unique.</p>
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="newPageId">Page ID <span className="text-red-500">*</span></label>
                        <input
                          id="newPageId"
                          className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none text-base"
                          placeholder="e.g. about, services"
                          value={newPageId}
                          onChange={e => setNewPageId(e.target.value)}
                          autoFocus
                          maxLength={50}
                          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                        />
                        {newPageId && !/^([a-zA-Z0-9\-_]+)$/.test(newPageId) && (
                          <div className="text-xs text-red-600 mt-1">Only letters, numbers, dashes, and underscores allowed.</div>
                        )}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="newPageTitle">Page Title</label>
                        <input
                          id="newPageTitle"
                          className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none text-base"
                          placeholder="e.g. About Us (optional)"
                          value={newPageTitle}
                          onChange={e => setNewPageTitle(e.target.value)}
                          maxLength={100}
                          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                        />
                      </div>
                      <button
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handleCreate}
                        disabled={actionLoading || !newPageId.trim() || !/^([a-zA-Z0-9\-_]+)$/.test(newPageId)}
                      >{actionLoading ? 'Adding...' : 'Add Page'}</button>
                    </div>
                  </div>
                </div>
              )}
              {sidebarOpen === 'trash' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-bold text-lg text-red-700">Trash</span>
                    <button className="text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => handleSidebarToggle('trash')}>&times;</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trash</h3>
                    {loadingPages ? (
                      <div className="flex items-center gap-2 text-red-600 font-semibold animate-pulse">
                        <span className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></span>
                        Loading...
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-start gap-2 text-red-600 font-semibold">
                        <span>{error}</span>
                        <button
                          className="mt-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm border border-red-700 transition"
                          onClick={fetchPages}
                        >Retry</button>
                      </div>
                    ) : filteredTrash.length === 0 ? (
                      <div className="py-2 text-gray-500">No deleted pages.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100 custom-scrollbar">
                        {filteredTrash.map(page => (
                          <li key={page.id} className="flex items-center justify-between py-2 group transition-all duration-200">
                            <span className="flex-1 px-2 py-1 text-left text-gray-400 line-through">{page.id}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                              <Tooltip label="Restore">
                                <button
                                  className="p-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-900 transition-colors"
                                  aria-label={`Restore page ${page.id}`}
                                  onClick={() => handleRestore(page.id)}
                                  disabled={actionLoading}
                                >♻️</button>
                              </Tooltip>
                              <Tooltip label="Delete Permanently">
                                <button
                                  className="p-1 rounded hover:bg-red-200 text-red-700 hover:text-red-900 transition-colors"
                                  aria-label={`Permanently delete page ${page.id}`}
                                  onClick={() => handlePermanentDelete(page.id)}
                                  disabled={actionLoading}
                                >🗑️</button>
                              </Tooltip>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Block/Template Panel */}
        <div className={`relative transition-all duration-300 ${blockPanelOpen ? 'w-80' : 'w-0'} bg-white/90 border-r border-gray-200 shadow-lg flex flex-col z-20`}>
          {/* Device Preview Controls (removed from here) */}
          {/* (No DevicePreviewDropdown here anymore) */}
          {blockPanelOpen && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-blue-700">Blocks</span>
                <button
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-lg font-semibold text-xs shadow hover:from-blue-600 hover:to-purple-600 transition"
                  onClick={() => setShowTemplates(true)}
                  aria-label="Show templates"
                >Templates</button>
              </div>
              <input
                type="text"
                placeholder="Search blocks..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm mb-2"
                value={blockSearch}
                onChange={e => setBlockSearch(e.target.value)}
                aria-label="Search blocks"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {blockCategories.map(cat => (
                  <button
                    key={cat}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${blockCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
                    onClick={() => setBlockCategory(cat)}
                  >{cat}</button>
                ))}
              </div>
            </div>
          )}
          {blockPanelOpen && <div id="gjs-blocks" className="flex-1 overflow-y-auto custom-scrollbar p-4" />}
        </div>
        {/* Editor Area */}
        <main className="flex-1 flex flex-col relative z-10 min-h-screen h-full w-full">
          <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToAdmin}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:scale-[1.02]"
                title="Back to Admin Panel"
              >
                <svg className="w-4 h-4 transition-transform duration-300 -translate-x-0.5 group-hover:-translate-x-1.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 17l-5-5m0 0l5-5m-5 5h12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="tracking-wide font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Return to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300 mx-2"></div>
              <span className="font-semibold text-lg gradient-text">{selectedPageId ? `Editing: ${pages.find(p => p.id === selectedPageId)?.title || selectedPageId}` : 'No page selected'}</span>
              {unsaved && selectedPageId && (
                <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 animate-pulse" title="You have unsaved changes">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  Unsaved
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <DevicePreviewDropdown
                previewDevice={previewDevice}
                setPreviewDevice={setPreviewDevice}
              />
              <button
                onClick={() => setShowPreview(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition hover:scale-105 duration-200"
                disabled={actionLoading}
                title="Preview page"
              >Preview</button>
              <button
                onClick={handlePublish}
                className={`btn-primary hover:scale-105 transition-transform duration-200 ${unsaved ? 'ring-2 ring-orange-400' : ''}`}
                disabled={actionLoading || !selectedPageId}
              >Publish</button>
            </div>
          </div>
          {/* Refactor main layout */}
          <div className="flex w-full h-full">
            {/* Sidebar: Page Management */}
            {/* This block is now handled by the new slim sidebar */}
            {/* Editor Area */}
            <div className="flex-1 relative flex flex-col">
              {/* Device Preview Controls */}
              {/* This block is now handled by the new slim sidebar */}
              {/* Editor */}
              <div className="flex-1 w-full h-full relative overflow-hidden">
                {loadingPageContent && <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10"><div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>Loading page...</div>}
                {selectedPageId ? (
                  <div id="gjs" className="flex-1 w-full h-full" style={{minHeight: 'calc(100vh - 64px)'}} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xl">No page selected. Create or select a page to start editing.</div>
                )}
              </div>
            </div>
          </div>
        </main>
        {/* Preview Modal */}
        <PreviewModal
          open={showPreview}
          html={editorRef.current ? editorRef.current.getHtml() : ''}
          css={editorRef.current ? editorRef.current.getCss() : ''}
          onClose={() => setShowPreview(false)}
        />
        <TemplatesModal open={showTemplates} onClose={() => setShowTemplates(false)} onInsert={handleInsertTemplate} />
        <RenameModal
          open={showRename}
          currentId={renameId}
          currentTitle={renameTitle}
          onRename={handleRename}
          onClose={() => setShowRename(false)}
          existingIds={[...pages.map(p => p.id), ...trash.map(p => p.id)]}
        />
      </div>
    </DndProvider>
  );
}