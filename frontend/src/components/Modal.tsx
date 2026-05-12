import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <div
          className={`relative bg-white w-full sm:rounded-lg shadow-xl ${widths[maxWidth]} max-h-[calc(100dvh-env(safe-area-inset-top,0px))] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-t-2xl sm:rounded-t-lg`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4 sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-4 py-3 sm:px-5 sm:py-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
