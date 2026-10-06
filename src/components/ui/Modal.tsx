import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '2xl'
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all animate-in fade-in duration-200">
      <div 
        className={`bg-surface rounded-md w-full ${maxWidthClasses[maxWidth]} flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-accent-100 shrink-0 bg-white">
          <h3 className="text-sm font-bold text-accent-900 uppercase tracking-widest">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-accent-400 p-1 rounded-full hover:bg-accent-50 hover:text-accent-600 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-accent-100 flex justify-end gap-3 shrink-0 bg-accent-50/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
