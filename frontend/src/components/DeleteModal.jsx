import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, onConfirm, promptTitle, isDeleting }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-craft-bg/85 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-craft-card border border-craft-cardBorder rounded-2xl shadow-2xl p-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 id="modal-title" className="font-serif text-xl font-bold text-craft-mainText">
              Delete Prompt
            </h3>
            <p className="mt-2 text-sm text-craft-mutedText leading-relaxed">
              Are you sure you want to permanently delete this prompt from your history?
            </p>
            {promptTitle && (
              <div className="mt-3 p-3 bg-craft-surface rounded-lg border border-craft-inputBorder text-xs font-mono text-craft-mutedText line-clamp-2">
                "{promptTitle}"
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-craft-mutedText hover:text-craft-mainText transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-craft-mutedText hover:text-craft-mainText bg-craft-surface hover:bg-craft-surfaceHover border border-craft-inputBorder rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Deleting...</span>
              </>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
