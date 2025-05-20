// src/components/UserManagement/DeleteConfirmationModal.tsx
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean; // To control visibility from parent
    onConfirm: () => void;
    onCancel: () => void;
    itemType: string;   // e.g., "user", "parolee", "officer"
    itemName: string;   // e.g., "John Doe"
    isDeleting?: boolean; // Optional: to show a loading state on the delete button
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    itemType,
    itemName,
    isDeleting = false
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full shadow-xl transform transition-all duration-300 ease-in-out scale-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center" id="modal-title">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Confirm Deletion
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to delete the {itemType}{' '}
                    <strong className="text-gray-800 dark:text-gray-100">{itemName}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="secondary-button px-4 py-2 text-sm" // Use global button styles
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="danger-button px-4 py-2 text-sm flex items-center" // Use global button styles
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;