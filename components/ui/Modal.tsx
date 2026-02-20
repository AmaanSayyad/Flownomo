import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Inner Border Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header */}
        {title && (
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">{title}</h2>
            {!showCloseButton && (
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Close Button (Footer) */}
        {showCloseButton && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
