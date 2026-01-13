/**
 * Real-time Features Demo Component
 * Demonstrates real-time capabilities and optimistic updates
 */

import React, { useState } from 'react';
import {
  useRealTimeCollection,
  useOptimisticCrud,
  useRealTimeStatus,
  useOptimisticFeedback
} from '../hooks/useRealTimeFeatures';

export default function RealTimeFeaturesDemo() {
  const [selectedCollection, setSelectedCollection] = useState('posts');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Real-time collection data
  const { data: collectionData, loading: collectionLoading } = useRealTimeCollection(selectedCollection, {
    orderByField: 'updatedAt',
    orderByDirection: 'desc',
    limitCount: 10
  });

  // Optimistic CRUD operations
  const { create, update, delete: remove, isLoading: crudLoading } = useOptimisticCrud(selectedCollection);

  // Real-time status
  const status = useRealTimeStatus();

  // Optimistic feedback
  const { isOptimistic } = useOptimisticFeedback();

  const handleCreate = async () => {
    if (!newItemTitle.trim()) return;
    try {
      await create({
        title: newItemTitle,
        content: `Sample content for ${newItemTitle}`,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setNewItemTitle('');
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await update(id, { ...updates, updatedAt: new Date() });
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await remove(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Real-time Features Demo</h1>

      {/* Status Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="text-sm">Network</div>
            <div className="text-xs text-gray-600">{status.isOnline ? 'Online' : 'Offline'}</div>
          </div>
          <div>
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${status.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="text-sm">Firebase</div>
            <div className="text-xs text-gray-600">{status.isAvailable ? 'Connected' : 'Unavailable'}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{status.activeSubscriptions}</div>
            <div className="text-sm">Subscriptions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{collectionData.length}</div>
            <div className="text-sm">Live Items</div>
          </div>
        </div>
      </div>

      {/* Collection Selector */}
      <div className="mb-6">
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="posts">Posts</option>
          <option value="pages">Pages</option>
          <option value="test">Test Collection</option>
        </select>
      </div>

      {/* Create New Item */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Enter title for new item..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={crudLoading || !newItemTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {crudLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Collection: {selectedCollection}</h3>
        </div>

        {collectionLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div>Loading...</div>
          </div>
        ) : collectionData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No items found. Create one above!
          </div>
        ) : (
          <div className="divide-y">
            {collectionData.map((item) => {
              const itemIsOptimistic = isOptimistic(selectedCollection, item.id);
              
              return (
                <div key={item.id} className={`p-4 ${itemIsOptimistic ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdate(item.id, { title: editingTitle });
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdate(item.id, { title: editingTitle })}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {item.title || item.id}
                            {itemIsOptimistic && (
                              <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Optimistic
                              </span>
                            )}
                            {item._optimistic && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">ID: {item.id}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingTitle(item.title);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Real-time Features</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Instant UI feedback with optimistic updates</div>
          <div>• Live synchronization across browser tabs</div>
          <div>• Offline support with automatic retry</div>
          <div>• Visual indicators for pending operations</div>
        </div>
        <div className="mt-3 p-3 bg-white rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Try:</strong> Open multiple tabs, create/edit items, and watch real-time updates!
          </p>
        </div>
      </div>
    </div>
  );
}