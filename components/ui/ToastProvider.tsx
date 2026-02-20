'use client';

/**
 * Toast Provider Component
 * Renders the toast container at the app level
 * 
 * Task: 9.2 Implement deposit transaction flow
 * Requirements: 8.5, 10.1
 */

import React from 'react';
import { ToastContainer } from './Toast';
import { useToastStore } from '@/lib/hooks/useToast';

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
};
