import React, { useEffect } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import '../popup.css';

export default function Alert({
  type = 'success',
  title,
  message,
  duration = 3000, // default 3 seconds
  onClose,
}) {
  // Auto dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="alert-icon success" />;
      case 'error':
        return <FaExclamationCircle className="alert-icon error" />;
      case 'info':
        return <FaInfoCircle className="alert-icon info" />;
      case 'warning':
        return <FaExclamationTriangle className="alert-icon warning" />;
      default:
        return null;
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      {getIcon()}
      <div className="alert-content">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
