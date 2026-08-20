import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, LayoutDashboard, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlanBlockModal = ({ isOpen, onClose, remainingCredits, type = 'block-purchase' }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
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
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-orange-100/50 to-transparent pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-colors z-20"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="p-10 pt-12 text-center relative z-10">
                        {type === 'block-purchase' ? (
                            <>
                                <div className="w-20 h-20 bg-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-100/30">
                                    <ShieldAlert className="w-10 h-10 text-orange-600" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                    Action Restricted
                                </h2>
                                <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                                    You still have <span className="text-black font-bold">{remainingCredits}</span> remaining interview credits. Please use your existing credits before purchasing or upgrading to a new plan.
                                </p>
                            </>
                        ) : type === 'payment' ? (
                            <>
                                <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100/30">
                                    <CreditCard className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                    Plan Required
                                </h2>
                                <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                                    You don't have an active subscription. Purchase a plan to unlock AI-powered interview practice and detailed feedback.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-[#D4F478]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#D4F478]/30">
                                    <Sparkles className="w-10 h-10 text-black" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                    Out of Credits
                                </h2>
                                <p className="text-gray-600 font-medium mb-10 leading-relaxed">
                                    You've used all your interview credits. Upgrade your plan to continue practicing and mastering your skills.
                                </p>
                            </>
                        )}

                        <div className="space-y-4">
                            {type === 'block-purchase' ? (
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/dashboard');
                                    }}
                                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                                >
                                    <LayoutDashboard className="w-5 h-5 text-orange-400" />
                                    Go to Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/dashboard/pricing');
                                    }}
                                    className="w-full bg-[#D4F478] text-black py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#D4F478]/20 flex items-center justify-center gap-3"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    View Premium Plans
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-4 text-gray-400 font-bold text-sm tracking-widest uppercase hover:text-gray-600 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PlanBlockModal;
