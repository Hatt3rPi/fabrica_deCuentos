import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, isOpen, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
