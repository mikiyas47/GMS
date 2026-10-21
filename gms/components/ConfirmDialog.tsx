import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  actionText?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  actionText = 'Delete',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Are you sure you want to {actionText.toLowerCase()} <span className="font-bold text-gray-900">"{itemName}"</span>? This action cannot be undone.
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#DC2626] text-white font-semibold hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : actionText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
