import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Smartphone, X, ArrowRight } from "lucide-react";

const MobileRestrictionModal = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>

                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Icon Illustration */}
                                <div className="mb-6 relative">
                                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center relative z-10">
                                        <Smartphone size={40} className="text-red-400" />
                                    </div>
                                    <div className="absolute top-0 right-0 -mr-4 -mt-2 bg-green-100 p-3 rounded-full z-20 border-4 border-white">
                                        <Monitor size={24} className="text-green-600" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                                    Desktop Only
                                </h3>

                                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                                    To ensure the best interview practice experience, this feature is optimized for larger screens.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 w-full mb-6 border border-gray-100">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                                            <Monitor size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Switch Device</p>
                                            <p className="text-xs text-gray-500">Please use a laptop or desktop</p>
                                        </div>
                                    </div>
                                </div>

                                {/* <button
                                    onClick={onClose}
                                    className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-black transition-colors shadow-lg"
                                >
                                    Got it, I'll switch
                                </button> */}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileRestrictionModal;
