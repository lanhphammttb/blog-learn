'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, Loader2, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => {
      // If new toast is not 'loading', remove all existing 'loading' toasts
      if (type !== 'loading') {
        const filtered = prev.filter(t => t.type !== 'loading');
        return [...filtered, { id, message, type }];
      }
      return [...prev, { id, message, type }];
    });

    if (type !== 'loading') {
      setTimeout(() => hideToast(id), 5000);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 min-w-[320px] max-w-md p-4 rounded-2xl shadow-2xl border bg-card/80 backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300 ${
              toast.type === 'success' ? 'border-green-500/20 shadow-green-500/10' :
              toast.type === 'error' ? 'border-red-500/20 shadow-red-500/10' :
              toast.type === 'loading' ? 'border-blue-500/20' : 'border-border'
            }`}
          >
            <div className={`p-2 rounded-xl ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'loading' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {toast.type === 'error' && <XCircle className="h-5 w-5" />}
              {toast.type === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {toast.type === 'info' && <Info className="h-5 w-5" />}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-bold">{toast.message}</p>
            </div>

            <button 
              onClick={() => hideToast(toast.id)}
              className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
