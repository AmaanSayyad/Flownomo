'use client';

/**
 * Toast management hook
 * Provides a simple API for showing toast notifications
 * 
 * Task: 9.2 Implement deposit transaction flow
 * Requirements: 8.5, 10.1
 */

import { create } from 'zustand';
import { ToastType } from '@/components/ui/Toast';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/**
 * Zustand store for toast management
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
  },
  
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  },
  
  clearAll: () => {
    set({ toasts: [] });
  }
}));

/**
 * Hook for showing toast notifications
 * Returns functions for showing different types of toasts
 */
export const useToast = () => {
  const { addToast } = useToastStore();
  
  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info')
  };
};
