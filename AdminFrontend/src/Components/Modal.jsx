import React from "react";
import { X } from "lucide-react";

/**
 * Consistently styled glassy modal for the dashboard
 */
const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-xl max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95 duration-300 border border-white/50">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-gray-100">
                    <X className="w-6 h-6" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default Modal;