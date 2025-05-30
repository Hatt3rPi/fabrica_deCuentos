import React from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  confirmLoading = false,
  onConfirm,
  onCancel,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div role="dialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">{message}</p>
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
            <Button onClick={onConfirm} isLoading={confirmLoading}>{confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
