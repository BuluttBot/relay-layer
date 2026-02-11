'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative bg-bg-secondary border border-border rounded-t-2xl md:rounded-2xl shadow-modal max-h-[90vh] overflow-y-auto w-full md:w-auto ${wide ? 'md:max-w-4xl' : 'md:max-w-lg'} transition-transform duration-300 ease-out`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-subtle">
            <h2 className="text-base md:text-lg font-semibold text-text-primary">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={18} className="text-text-secondary" />
            </button>
          </div>
        )}
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
