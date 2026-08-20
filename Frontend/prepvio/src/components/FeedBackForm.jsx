import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Star, 
  Send, 
  Zap, 
  Heart,
  Smile,
  CheckCircle2,
  Sparkles,
  Layout,
  Type
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12, delayChildren: 0.2, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("general");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { id: "content", label: "Content", icon: Type, color: "bg-orange-500" },
    { id: "bug", label: "Report Bug", icon: Zap, color: "bg-red-500" },
    { id: "general", label: "General", icon: MessageSquare, color: "bg-blue-500" },
    { id: "ui", label: "Design", icon: Layout, color: "bg-purple-500" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4F478] rounded-full blur-[80px] opacity-40" />
          <div className="w-24 h-24 bg-[#D4F478] rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#D4F478]/40 relative z-10">
            <CheckCircle2 className="w-12 h-12 text-black -rotate-12" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">You're Awesome!</h2>
          <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed">
            Your feedback is the fuel that helps us build the extraordinary. We appreciate you!
          </p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            Send More Feedback
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black p-4 md:p-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#D4F478]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header Section */}
        <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black text-[#D4F478] text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Sparkles className="w-3 h-3" /> Feedback Hub
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              Help us <br /><span className="text-gray-400 italic">level up.</span>
            </h1>
          </div>
          <p className="text-gray-400 font-bold text-lg md:text-right max-w-[280px]">
            Have a thought, a bug, or just want to say hi? We're all ears.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Categories and Rating */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category Selection */}
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white/20">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 block">
                Topic Selection
              </label>
              <div className="grid grid-cols-1 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                        isActive 
                          ? "bg-black border-black text-white shadow-xl shadow-black/10 translate-x-2" 
                          : "bg-white/50 border-gray-100 text-gray-600 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${isActive ? "bg-[#D4F478] text-black" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{cat.label}</span>
                      </div>
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#D4F478]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Experience Rating */}
            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-white/20">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 block text-center">
                Overall Satisfaction
              </label>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1.5 transition-all duration-300 hover:scale-125"
                    >
                      <Star 
                        className={`w-9 h-9 transition-all duration-300 ${
                          (hoverRating || rating) >= star 
                            ? "fill-[#D4F478] text-[#D4F478] drop-shadow-[0_0_8px_rgba(212,244,120,0.5)]" 
                            : "text-gray-100"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs font-black text-gray-900 bg-[#D4F478] px-3 py-1 rounded-full uppercase"
                      >
                        {rating === 5 ? "Perfect!" : rating >= 3 ? "Good" : "Needs work"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Text and Submission */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            <motion.div variants={itemVariants} className="bg-white p-1 rounded-[3rem] shadow-sm border border-gray-100 flex-1 flex flex-col">
              <div className="p-8 pb-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                  Detailed Thoughts
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder={`Tell us about your experience with ${category}...`}
                  className="w-full bg-gray-50/50 border-none focus:ring-0 rounded-2xl p-6 outline-none transition-all font-medium text-lg text-gray-800 resize-none min-h-[300px]"
                />
              </div>
              
              <div className="px-8 pb-8 mt-auto">
                 <div className="flex items-center gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 group cursor-pointer transition-colors hover:border-gray-200">
                    <input 
                      type="checkbox" 
                      id="follow-up" 
                      className="w-5 h-5 rounded-lg border-2 border-gray-200 text-black focus:ring-black accent-black cursor-pointer"
                    />
                    <label htmlFor="follow-up" className="text-sm font-bold text-gray-500 cursor-pointer select-none group-hover:text-gray-900 transition-colors">
                      Get updates on this feedback
                    </label>
                 </div>
              </div>
            </motion.div>

            {/* Submit Section */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="flex-[2] bg-black text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                Send Feedback
                <Send className="w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
              <button
                type="button"
                className="flex-1 px-8 py-6 bg-white border border-gray-100 rounded-[2rem] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        </form>

        <footer className="mt-16 text-center border-t border-gray-100 pt-8 flex flex-col items-center gap-4">
          <div className="flex gap-8">
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                <Zap className="w-3 h-3" /> Real-time
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                <Smile className="w-3 h-3" /> Anonymous
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                <Heart className="w-3 h-3" /> Human-led
             </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}