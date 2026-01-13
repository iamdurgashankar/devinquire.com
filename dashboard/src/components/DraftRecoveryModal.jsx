import React, { useState, useEffect } from 'react';
import { Clock, FileText, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import enhancedApiService from '../services/enhancedApiService';

const DraftRecoveryModal = ({ isOpen, onClose, onRecover }) => {
  const [recoverableDrafts, setRecoverableDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadRecoverableDrafts();
    }
  }, [isOpen]);

  const loadRecoverableDrafts = async () => {
    try {
      setLoading(true);
      const drafts = enhancedApiService.getRecoverableDrafts();
      setRecoverableDrafts(drafts);
    } catch (error) {
      console.error('Error loading recoverable drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = (draft) => {
    try {
      const recoveredData = enhancedApiService.recoverDraft(draft);
      if (recoveredData) {
        onRecover(recoveredData);
        onClose();
      }
    } catch (error) {
      console.error('Error recovering draft:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getDraftPreview = (content) => {
    if (!content) return 'No content';
    // Remove HTML tags and get first 100 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recover Drafts</h2>
              <p className="text-sm text-gray-600">
                Found {recoverableDrafts.length} recoverable draft{recoverableDrafts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading recoverable drafts...</span>
            </div>
          ) : recoverableDrafts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recoverable Drafts</h3>
              <p className="text-gray-600">
                No recent drafts were found that can be recovered.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recoverableDrafts.map((draft, index) => (
                <div
                  key={`${draft.id || 'new'}-${index}`}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDraft === draft
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {draft.title || 'Untitled Draft'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {draft.is_current_session && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Current Session
                            </span>
                          )}
                          {draft.is_auto_save && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Auto-saved
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            draft.source === 'local' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {draft.source === 'local' ? 'Local' : 'Queued'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {getDraftPreview(draft.content)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(draft.saved_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{draft.word_count} words</span>
                        </div>
                        <div>
                          Version {draft.version}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecover(draft);
                      }}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Recover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {recoverableDrafts.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Drafts are automatically saved and kept for 24 hours
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {selectedDraft && (
                <button
                  onClick={() => handleRecover(selectedDraft)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Recover Selected
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftRecoveryModal;