import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] flex items-center p-4 rounded-2xl border shadow-lg shadow-slate-200/50 transform transition-all duration-300 animate-in slide-in-from-top-2 ${styles[notification.type]}`}>
      <div className="flex-shrink-0 mr-3">
        {icons[notification.type]}
      </div>
      <div className="flex-1 text-sm font-medium">
        {notification.message}
      </div>
      <button 
        onClick={onClose}
        className="ml-2 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};