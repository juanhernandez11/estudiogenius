import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};