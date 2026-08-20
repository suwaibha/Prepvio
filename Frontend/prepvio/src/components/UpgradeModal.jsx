import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, featureName }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#D4F478]/30 to-transparent pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-colors z-20"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="p-10 pt-12 text-center relative z-10">
                        <div className="w-20 h-20 bg-[#D4F478] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#D4F478]/30">
                            <Sparkles className="w-10 h-10 text-black" />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                            Upgrade Required
                        </h2>

                        <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                            Unlock <span className="text-black font-bold uppercase tracking-tight">{featureName}</span> and more by upgrading to a higher plan.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/dashboard/pricing');
                                }}
                                className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                            >
                                <Rocket className="w-5 h-5 text-[#D4F478]" />
                                View Pricing Plans
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-4 text-gray-400 font-bold text-sm tracking-widest uppercase hover:text-gray-600 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UpgradeModal;
