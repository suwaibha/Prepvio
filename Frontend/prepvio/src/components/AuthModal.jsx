import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, type = 'login' }) => {
  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4F478]/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-[#D4F478] flex items-center justify-center mb-6">
                {type === 'login' ? (
                  <Lock className="w-8 h-8 text-black" />
                ) : (
                  <Mail className="w-8 h-8 text-black" />
                )}
              </div>

              {/* Title & Description */}
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                {type === 'login' ? 'Login Required' : 'Verify Your Email'}
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                {type === 'login' 
                  ? 'Please login to purchase a plan and start your interview preparation journey.'
                  : 'Please verify your email address before purchasing a plan. Check your inbox for the verification link.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link to={type === 'login' ? '/login' : '/verify-email'}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:bg-gray-800 transition-colors"
                  >
                    {type === 'login' ? 'Go to Login' : 'Go to Verification'}
                  </motion.button>
                </Link>

                {type === 'login' && (
                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white border-2 border-gray-200 text-gray-900 py-4 rounded-2xl font-bold text-base hover:border-gray-300 transition-colors"
                    >
                      Create Account
                    </motion.button>
                  </Link>
                )}

                {/* <button
                  onClick={onClose}
                  className="w-full text-gray-500 py-3 font-medium hover:text-gray-700 transition-colors"
                >
                  Maybe Later
                </button> */}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;