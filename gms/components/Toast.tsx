import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let bg = 'bg-blue-600 text-white';
  let Icon = Info;

  if (toast.type === 'success') {
    bg = 'bg-[#16A34A] text-white';
    Icon = CheckCircle2;
  } else if (toast.type === 'error') {
    bg = 'bg-[#DC2626] text-white';
    Icon = AlertCircle;
  }

  return (
    <div className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-xl ${bg} text-sm font-medium transition-all transform duration-300 animate-slideIn`}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="leading-snug">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
