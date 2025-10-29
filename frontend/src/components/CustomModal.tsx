import React, { useEffect, useRef } from 'react';
import './CustomModal.css';

interface CustomModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'prompt';
  promptValue?: string;
  onPromptChange?: (value: string) => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  type = 'confirm',
  promptValue = '',
  onPromptChange
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 处理ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 点击遮罩层关闭弹窗
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (onClose) {
        onClose();
      }
    }
  };

  // 处理确认按钮点击
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  // 处理取消按钮点击
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="custom-modal-backdrop" onClick={handleBackdropClick}>
      <div className="custom-modal" ref={modalRef}>
        <div className="custom-modal-header">
          <h3>{title}</h3>
          <button className="custom-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="custom-modal-body">
          <p>{message}</p>
          {type === 'prompt' && (
            <input
              type="text"
              value={promptValue}
              onChange={(e) => onPromptChange && onPromptChange(e.target.value)}
              className="custom-modal-input"
              autoFocus
            />
          )}
        </div>
        <div className="custom-modal-footer">
          {type !== 'alert' && (
            <button className="custom-modal-button custom-modal-cancel" onClick={handleCancel}>
              {cancelText}
            </button>
          )}
          <button 
            className="custom-modal-button custom-modal-confirm"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;