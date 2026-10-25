import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-100'
              : toast.type === 'success'
              ? 'bg-craft-card/95 border-craft-cardBorder text-craft-promptText'
              : 'bg-craft-surface/95 border-craft-inputBorder text-craft-mainText'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-craft-primary" />
            ) : (
              <Info className="w-5 h-5 text-craft-accent" />
            )}
          </div>
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {toast.message}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-craft-mutedText hover:text-craft-mainText transition-colors p-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
