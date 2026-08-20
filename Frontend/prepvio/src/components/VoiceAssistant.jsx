import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, MessageCircle, Send, Loader2, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mainApi } from '../utils/apiClient.js';
import { useAuthStore } from '../store/authstore.js';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const recognitionRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [conversation]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                addToConversation('user', text);
                handleCommand(text);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    }, []);

    const toggleListening = () => {
        if (!isOpen) setIsOpen(true);

        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    const addToConversation = (role, message) => {
        setConversation(prev => [...prev, { role, message, timestamp: new Date() }]);
    };

    const handleCommand = async (text) => {
        const lowerText = text.toLowerCase();

        // --- Navigation Commands ---
        const commands = {
            'home': '/',
            'go home': '/',
            'dashboard': '/dashboard',
            'go dashboard': '/dashboard',
            'courses': '/dashboard/learning',
            'show courses': '/dashboard/learning',
            'learning': '/dashboard/learning',
            'continue learning': '/dashboard/learning',
            'saved': '/dashboard/saved-courses',
            'my saved courses': '/dashboard/saved-courses',
            'favorites': '/dashboard/saved-courses',
            'interview': '/services/check-your-ability/interview',
            'take interview': '/services/check-your-ability/interview',
            'start interview': '/services/check-your-ability/interview',
            'practice interview': '/services/check-your-ability/interview',
            'results': '/dashboard/interview-analysis',
            'show results': '/dashboard/interview-analysis',
            'analysis': '/dashboard/interview-analysis',
            'report': '/dashboard/interview-analysis',
            'messages': '/dashboard/messages/inbox',
            'inbox': '/dashboard/messages/inbox',
            'chat': '/dashboard/messages/inbox',
            'profile': '/dashboard/setting',
            'settings': '/dashboard/setting',
            'account': '/dashboard/setting',
            'pricing': '/dashboard/current-plan',
            'plans': '/dashboard/current-plan',
            'subscription': '/dashboard/current-plan',
            'help': '/dashboard/help/faq',
            'faq': '/dashboard/help/faq',
            'support': '/dashboard/help/faq',
            'aptitude': '/services/check-your-ability/aptitude',
            'aptitude test': '/services/check-your-ability/aptitude',
            'take test': '/services/check-your-ability/aptitude',
            'feedback': '/dashboard/feedback',
            'notifications': '/dashboard/notifications'
        };

        let navigated = false;

        for (const [cmd, path] of Object.entries(commands)) {
            if (lowerText.includes(cmd)) {
                navigate(path);
                const response = `Navigating to ${cmd}...`;
                addToConversation('assistant', response);
                speak(response);
                navigated = true;
                break;
            }
        }

        if (!navigated) {
            await askAI(text);
        }
    };

    const askAI = async (query) => {
        setIsLoading(true);
        try {
            const response = await mainApi.post('/ai/chat', {
                message: query
            });

            if (response.data.success) {
                addToConversation('assistant', response.data.reply);
                speak(response.data.reply);
            }
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = "Sorry, I couldn't process that. Please try again.";
            addToConversation('assistant', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (textInput.trim()) {
            addToConversation('user', textInput);
            handleCommand(textInput);
            setTextInput('');
        }
    };

    const speak = (text) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        synth.speak(utterance);
    };

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        return null;
    }

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 font-sans">
            {/* Chat Bubble */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-gray-900/10 w-[420px] border border-gray-100/50 mb-2 relative overflow-hidden flex flex-col h-[550px]"
                    >
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl px-6 pt-6 pb-4 rounded-t-[2rem] border-b border-gray-100/50 relative z-20">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                        <Sparkles className="w-5 h-5 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 tracking-tight text-lg">
                                            AI Assistant
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">Always here to help</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Scrollable Conversation History */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 relative z-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {conversation.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        Click the mic or type below
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        I can help you navigate or answer questions
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {conversation.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                                ? 'bg-[#1A1A1A] text-white rounded-br-md'
                                                : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 rounded-bl-md border border-gray-200/50'
                                                }`}>
                                                <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                                                <span className={`text-[10px] mt-1.5 block font-medium ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 text-sm py-3 px-4 rounded-2xl rounded-bl-md flex items-center gap-2 shadow-sm border border-gray-200/50">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                                <span className="font-medium">Thinking...</span>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Fixed Input Area */}
                        <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl px-6 pb-6 pt-4 rounded-b-[2rem] border-t border-gray-200/50 relative z-20">
                            <form onSubmit={handleTextSubmit}>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium placeholder:text-gray-400 transition-all"
                                        disabled={isLoading}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!textInput.trim() || isLoading}
                                        className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
                                    >
                                        <Send className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                {/* Status Indicator */}
                                <div className="flex items-center justify-center mt-3">
                                    {isListening ? (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-red-500 font-bold flex items-center gap-2"
                                        >
                                            <motion.span
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="w-2 h-2 bg-red-500 rounded-full"
                                            />
                                            Listening...
                                        </motion.span>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-medium">
                                            Click mic or type to chat
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                className={`relative p-3 rounded-full shadow-2xl transition-all flex items-center justify-center group overflow-hidden ${isListening
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-yellow-500/50'
                    : 'bg-gradient-to-br from-[#1A1A1A] to-gray-900 shadow-gray-900/30'
                    }`}
            >
                {/* Pulsing Ring Effect */}
                {isListening && (
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-yellow-300"
                    />
                )}

                {/* Glow Effect on Hover */}
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isListening
                    ? 'bg-yellow-400/50 opacity-60'
                    : 'bg-yellow-400/50 opacity-0 group-hover:opacity-60'
                    }`} />

                {/* Icon */}
                <div className="relative z-10">
                    {isListening ? (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Mic className="w-5 h-5 text-black" />
                        </motion.div>
                    ) : (
                        <Zap className="w-5 h-5 text-yellow-400" />
                    )}
                </div>

                {/* Badge */}
                {!isOpen && conversation.length > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-lg"
                    >
                        {conversation.length}
                    </motion.div>
                )}
            </motion.button>

            {/* Custom Scrollbar Styles */}
            <style>{`
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #d1d5db;
                        border-radius: 10px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: #9ca3af;
                    }
                `}</style>
        </div>
    );
};

export default VoiceAssistant;