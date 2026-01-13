import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  postTitle, 
  loading = false 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1); // 1: warning, 2: confirmation

  const truncatedTitle = postTitle?.length > 50 
    ? postTitle.substring(0, 50) + '...' 
    : postTitle || 'this post';

  const handleClose = () => {
    setConfirmText('');
    setStep(1);
    onClose();
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === 'delete') {
      onConfirm();
      handleClose();
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete Post
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <>
              {/* Warning Step */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to delete this post?
                </h3>
                <p className="text-gray-600 text-sm">
                  "{truncatedTitle}"
                </p>
              </div>

              {/* Warning List */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-800 mb-2">This action will permanently remove:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• The post content and metadata</li>
                  <li>• All associated media files</li>
                  <li>• Comments and interactions</li>
                  <li>• SEO data and analytics</li>
                </ul>
                <p className="text-sm text-red-800 font-medium mt-3">
                  ⚠️ This action cannot be undone!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Final Confirmation Required
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  To confirm deletion of "{truncatedTitle}", please type <strong>DELETE</strong> below:
                </p>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    confirmText && !isConfirmValid 
                      ? 'border-red-300 bg-red-50' 
                      : isConfirmValid 
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  autoFocus
                />
                {confirmText && !isConfirmValid && (
                  <p className="text-sm text-red-600 mt-2">
                    Please type "DELETE" exactly as shown
                  </p>
                )}
                {isConfirmValid && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Confirmation text matches
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isConfirmValid || loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    !isConfirmValid || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;