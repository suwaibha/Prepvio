import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, title = "Confirm Delete", message, isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <Modal title={title} onClose={onClose}>
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-4">
                    {message ? (
                        <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-slate-600 font-medium">Are you sure you want to delete</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">"{itemName}"?</p>
                        </div>
                    )}
                    <div className="flex justify-center">
                        <p className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg inline-block">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full pt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black hover:bg-slate-100 transition-all border border-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Trash2 className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'Deleting...' : 'Delete'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;