import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const Notification = ({ notification, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = (type) => {
    const baseStyles = "flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg transition-all duration-300 ease-in-out";

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 text-green-800 border border-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 text-red-800 border border-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-800 border border-yellow-200`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 text-blue-800 border border-blue-200`;
    }
  };

  return (
    <div className={getStyles(notification.type)} role="alert">
      <div className="flex items-center">
        {getIcon(notification.type)}
        <div className="ml-3 font-medium">
          {notification.message}
        </div>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300"
        aria-label="Close notification"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-sm">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;