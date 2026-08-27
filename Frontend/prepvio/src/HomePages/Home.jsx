// Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { mainApi } from "../utils/apiClient";
import AuthModal from "../components/AuthModal"; // Add this line
import MobileRestrictionModal from "../components/MobileRestrictionModal"; // ✅ ADD THIS
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Globe,
  TrendingUp,
  Mic,
  Briefcase,
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  Star,
  Calendar,
  Lock,
  Sparkles,
  Check,
  Zap,
  Crown,
  Rocket,
  X
} from "lucide-react";

// ✅ Import Existing Functional Components
import Header from "./Header";
import ZigZagServices from "../HomePages/ZigZagServices";
import AboutUs from "../HomePages/AboutUs";
import FAQSection from "./Faqs";
import { useAuthStore } from "../store/authstore";



/**
 * ASSETS & CONFIGURATION
 */
const ASSETS = {
  babaAi: "/BABA AI.png",
  siraAi: "/SIRA.png",
};



/**
 * ANIMATION VARIANTS
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1, ease: "easeOut" } },
};

const itemUpVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 } },
};

const itemSideVariants = (direction = "left") => ({
  hidden: { x: direction === "left" ? -40 : 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
});

const floatVariants = {
  animate: { y: [0, -12, 0], rotate: [0, 4, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } },
};

const hoverCardEffect = {
  y: -8, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)", transition: { type: "spring", stiffness: 300, damping: 20 },
};

const switchVariants = {
  initial: { opacity: 0, scale: 0.9, rotateY: 15 },
  animate: { opacity: 1, scale: 1, rotateY: 0, transition: { duration: 0.8, type: "spring" } },
  exit: { opacity: 0, scale: 0.9, rotateY: -15, transition: { duration: 0.5 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

/**
 * SUB-COMPONENTS
 */

// ✅ FIXED HeroTextSection with "Resume Practice" logic
const HeroTextSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [showMobileModal, setShowMobileModal] = useState(false); // ✅ ADD MOBILE MODAL STATE

  // ✅ Check if user has used any credits
  const hasStartedInterviews = user?.subscription?.interviewsUsed > 0;
  const buttonText = hasStartedInterviews ? "Resume Practice" : "Start Practice";

  const handleStartPractice = () => {
    // Check for mobile device
    if (window.innerWidth < 768) {
      setShowMobileModal(true);
      return;
    }

    if (!isAuthenticated) {
      setModalType('login');
      setShowAuthModal(true);
      return;
    }

    if (!user?.isVerified) {
      setModalType('verify');
      setShowAuthModal(true);
      return;
    }

    // Navigate to interview page if authenticated and verified
    navigate('/services/check-your-ability/interview');
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type={modalType}
      />
      <MobileRestrictionModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

      <motion.div variants={itemSideVariants("left")} className="flex flex-col justify-center h-full relative z-30">
        <motion.div variants={floatVariants} animate="animate" className="absolute -top-16 -left-12 w-32 h-32 bg-purple-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="relative">
          <h1 className="text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] text-gray-900 mb-6 drop-shadow-sm">
            Master <br />
            <span className="text-4xl md:text-5xl xl:text-6xl font-medium text-gray-400 block mt-2 ml-1">
              Your Interview
            </span>
          </h1>
          <motion.div initial={{ width: 0 }} animate={{ width: 100 }} transition={{ delay: 1, duration: 1 }} className="h-1.5 bg-[#D4F478] mt-2 rounded-full mb-6 ml-2" />
        </div>

        <p className="text-gray-500 mb-10 max-w-xl text-lg leading-relaxed ml-1 font-medium">
          AI-powered simulations that transform nervous energy into executive presence before the stakes are real.
        </p>

        <div className="flex items-center gap-4 ml-1 relative z-40">
          <motion.button
            onClick={handleStartPractice}
            whileHover="hover"
            whileTap="tap"
            className="flex items-center gap-0 group cursor-pointer"
          >
            <span className="bg-[#1A1A1A] text-white px-8 py-4 rounded-l-full font-bold text-lg shadow-xl shadow-gray-300/50 z-10 relative">
              {buttonText} {/* ✅ Dynamic button text */}
            </span>
            <motion.span
              className="w-14 h-[3.75rem] flex items-center justify-center rounded-r-full bg-[#D4F478] border-l-2 border-[#1A1A1A] group-hover:bg-[#cbf060] transition-colors origin-left"
              variants={{ hover: { x: 5 }, tap: { x: 0 } }}
            >
              <ArrowRight className="w-6 h-6 text-black group-hover:rotate-[-45deg] transition-transform duration-300" />
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

const AgentCard = () => (
  <motion.div variants={itemUpVariants} whileHover={hoverCardEffect} className="bg-[#2A2A2A] rounded-[2.5rem] p-6 text-white flex items-center gap-5 relative overflow-hidden shadow-2xl shadow-gray-900/10 cursor-pointer group z-20">
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors pointer-events-none" />
    <div className="relative shrink-0">
      <div className="w-20 h-20 rounded-full absolute -inset-1 bg-gradient-to-tr from-yellow-200 to-transparent blur-md opacity-20 animate-pulse pointer-events-none"></div>
      <img src={ASSETS.babaAi} alt="BABA AI" className="w-20 h-20 rounded-2xl object-cover relative z-10 border-[3px] border-[#3A3A3A] shadow-lg" />
      <div className="absolute -bottom-2 -right-2 bg-[#D4F478] text-black text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full z-20 shadow-lg border border-[#2A2A2A]">
        BABA AI
      </div>
    </div>
    <div className="relative z-10 flex flex-col justify-center">
      <h4 className="font-bold text-xl mb-1 tracking-tight">Real-time Fixes</h4>
      <p className="text-gray-400 text-xs font-medium mb-2.5">Instant Voice Assistant</p>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="w-3.5 h-3.5 fill-[#D4F478] text-[#D4F478]" />))}
      </div>
    </div>
  </motion.div>
);

const InfoCard = () => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const target = 87;
      const interval = setInterval(() => {
        current += 2;
        if (current >= target) { setScore(target); clearInterval(interval); } else { setScore(current); }
      }, 30);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div variants={itemUpVariants} whileHover={hoverCardEffect} className="bg-white rounded-[2.5rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden min-h-[220px] border border-gray-100 h-full z-20">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-50 rounded-full blur-xl opacity-80 pointer-events-none" />
      <div>
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-5 text-green-600 shadow-inner">
          <TrendingUp className="w-6 h-6 fill-current" />
        </div>
        <h3 className="font-bold text-2xl mb-2 text-gray-900 tracking-tight">Confidence</h3>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black text-gray-900">{score}%</span>
          <span className="text-gray-400 font-medium mb-2">Score</span>
        </div>
      </div>
      <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-green-400 to-[#D4F478]" />
      </div>
    </motion.div>
  );
};

const HeroServicesCard = () => (
  <motion.div variants={itemUpVariants} whileHover={hoverCardEffect} className="bg-[#EAE6F5] rounded-[2.5rem] p-7 relative overflow-hidden flex flex-col h-full shadow-sm cursor-pointer z-20">
    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/50 rounded-full blur-[40px] pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/40 rounded-full blur-[40px] pointer-events-none" />
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h3 className="font-bold text-xl text-gray-800 tracking-tight">Training Mode</h3>
      <div className="bg-white p-2 rounded-full shadow-sm"><Mic className="w-5 h-5 text-purple-500" /></div>
    </div>
    <div className="space-y-2.5 relative z-10 mt-auto">
      {[{ id: "01", text: "Behavioral Questions" }, { id: "02", text: "Technical Deep Dive" }, { id: "03", text: "Case Studies" }].map((item, idx) => (
        <motion.div key={idx} whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.9)" }} className="bg-white/60 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 transition-colors border border-white/20 shadow-sm cursor-pointer">
          <span className="text-[10px] font-bold bg-black text-white w-5 h-5 flex items-center justify-center rounded-full shrink-0">{item.id}</span>
          <span className="text-sm font-bold text-gray-700">{item.text}</span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const SuccessStoryCard = () => (
  <motion.div variants={itemSideVariants("right")} className="h-full z-20 relative">
    <motion.div whileHover={hoverCardEffect} className="bg-white rounded-[2.5rem] p-5 h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden border border-gray-100 group">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="relative mt-8 mb-4 w-full flex justify-center perspective-1000">
        <div className="w-48 h-48 rounded-full bg-blue-100/50 absolute top-4 blur-2xl scale-75 animate-pulse pointer-events-none" />

        <motion.img
          initial={{ rotateY: 10 }}
          whileHover={{ rotateY: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          src={ASSETS.siraAi}
          alt="SIRA AI"
          className="relative z-10 w-48 h-60 object-cover rounded-[2rem] shadow-2xl shadow-blue-900/20"
          style={{ clipPath: "path('M 20 0 H 172 A 20 20 0 0 1 192 20 V 190 A 40 40 0 0 1 152 230 H 40 A 40 40 0 0 1 0 190 V 20 A 20 20 0 0 1 20 0 Z')" }}
        />

        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-16 -right-2 z-20 bg-white p-2.5 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">
            <Briefcase className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
      <div className="mt-auto w-full bg-[#F8F9FB] rounded-[2rem] p-5 border border-gray-100 group-hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="text-left"><div className="font-bold text-gray-900 tracking-tight text-lg">SIRA AI.</div><div className="text-xs text-gray-500 font-medium">PrepVio AI models</div></div>
          <div className="bg-white p-1.5 rounded-full shadow-sm"><Globe className="w-4 h-4 text-blue-500" /></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">{[1, 2, 3, 4].map((i) => (<div key={i} className={`w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] overflow-hidden`}><img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" /></div>))}</div>
          <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-100">Coming Soon..</div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const MetricCard = ({ label, value, color }) => (
  <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50 text-center backdrop-blur-sm">
    <div className={`text-xs font-bold ${color}`}>{value}</div>
    <div className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
  </div>
);

const HeroVisual = () => (
  <motion.div variants={switchVariants} initial="initial" animate="animate" exit="exit" className="h-full flex items-center z-20 relative">
    <div className="relative w-full max-w-lg mx-auto transform transition-transform hover:scale-[1.01] duration-500">
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-4">
          <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/80"></div><div className="w-3 h-3 rounded-full bg-yellow-500/80"></div><div className="w-3 h-3 rounded-full bg-emerald-500/80"></div></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><div className="text-[10px] font-mono text-slate-400">REC • 04:12</div></div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-slate-800 rounded-2xl aspect-video relative overflow-hidden group min-h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"><Users className="text-slate-600 opacity-50" size={48} /></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-slate-600 rounded-t-full opacity-80 blur-sm pointer-events-none"></div>
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-lg"><Activity size={10} /> Live Analysis</div>
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-amber-500/50 rounded-xl p-3 transform transition-all shadow-xl animate-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3"><AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} /><div><p className="text-xs font-semibold text-slate-200">Pacing Alert</p><p className="text-[10px] text-slate-400 mt-0.5 leading-tight">You are speaking too fast (180wpm). Take a breath to improve clarity.</p></div></div>
            </div>
          </div>
          <div className="w-20 space-y-2 hidden sm:block">
            <MetricCard label="Confidence" value="82%" color="text-emerald-400" />
            <MetricCard label="Eye Contact" value="95%" color="text-emerald-400" />
            <MetricCard label="Clarity" value="64%" color="text-amber-400" />
            <div className="h-14 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50"><Mic size={16} className="text-slate-500 animate-pulse" /></div>
          </div>
        </div>
      </div>
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  </motion.div>
);

const FloatingDecoration = () => (
  <motion.div variants={floatVariants} animate="animate" className="absolute top-24 right-1/4 pointer-events-none z-0 hidden lg:block">
    <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
      <path d="M20,60 Q40,10 60,60 T90,60" stroke="#FBCFE8" strokeWidth="6" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0px 4px 8px rgba(251, 207, 232, 0.6))" }} />
      <circle cx="85" cy="35" r="6" fill="#FBCFE8" />
      <circle cx="15" cy="80" r="4" fill="#FBCFE8" />
    </svg>
  </motion.div>
);

const PartnersSection = () => (
  <div className="py-12 md:py-20 overflow-hidden">
    <div className="text-center mb-8"><span className="text-xs font-bold uppercase tracking-widest text-gray-400">Prepare for roles at top-tier companies</span></div>
    <div className="relative flex overflow-x-hidden group">
      <div className="animate-marquee whitespace-nowrap flex gap-16 items-center px-4">
        {['Google', 'Microsoft', 'Goldman Sachs', 'Deloitte', 'Amazon'].map((uni, i) => (
          <span key={i} className="text-2xl font-bold text-gray-300 flex items-center gap-2 hover:text-gray-400 transition-colors cursor-default"><div className="w-8 h-8 rounded-full bg-gray-200"></div> {uni}</span>
        ))}
        {['Google', 'Microsoft', 'Goldman Sachs', 'Deloitte', 'Amazon'].map((uni, i) => (
          <span key={`dup-${i}`} className="text-2xl font-bold text-gray-300 flex items-center gap-2 hover:text-gray-400 transition-colors cursor-default"><div className="w-8 h-8 rounded-full bg-gray-200"></div> {uni}</span>
        ))}
      </div>
    </div>
  </div>
);

const ProblemSection = () => (
  <div className="max-w-[1600px] mx-auto px-6 mb-20">
    <motion.div whileHover={{ y: -5 }} className="bg-[#1A1A1A] rounded-[3.5rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-gray-900/20">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">You Know Your Stuff. <br /><span className="text-gray-500">Why Do Interviews Feel Like a Gamble?</span></h2>
        <div className="space-y-4 text-lg text-gray-400 leading-relaxed"><p>"Your mind goes blank when asked 'Tell me about yourself.'"</p><p>"You ramble under pressure, losing the interviewer's attention."</p><p>"The regret of better answers keeps you up at night."</p></div>
        <div className="pt-4"><span className="text-[#D4F478] font-bold text-xl tracking-tight">There's a reason top performers make it look easy...</span></div>
      </div>
    </motion.div>
  </div>
);

// ✅ PLANS DATA (from payment.jsx)
const plans = [
  {
    id: 'monthly',
    name: 'Basic',
    price: '₹79',
    priceValue: 79,
    duration: '/month',
    interviews: 4,
    icon: Zap,
    isRecommended: false,
    color: 'bg-blue-50 text-blue-600',
    description: "Essential tools for casual learners.",
    features: [
      { text: '4 AI Interviews', included: true },
      { text: 'Access to analyzed feedback (pdf)', included: true },
      { text: 'Access to Project Map After Course Completion', included: true },
      { text: 'Access to Interview Replay', included: false },
      { text: 'Access to Code Editor', included: false },
      { text: 'Access to highlighted clips', included: false }
    ]
  },
  {
    id: 'premium',
    name: 'Pro Access',
    price: '₹179',
    priceValue: 179,
    duration: '/month',
    interviews: 9,
    icon: Crown,
    isRecommended: true,
    color: 'bg-[#D4F478] text-black',
    description: "Best for serious students & job seekers.",
    features: [
      { text: '9 AI Interviews', included: true },
      { text: 'Access to analyzed feedback (pdf)', included: true },
      { text: 'Direct Access to Project Map', included: true },
      { text: 'Access to Interview Replay', included: true },
      { text: 'Access to Code Editor', included: true },
      { text: 'Access to highlighted clips', included: false }
    ]
  },
  {
    id: 'yearly',
    name: 'Premium Plan',
    price: '₹499',
    priceValue: 499,
    duration: '/month',
    interviews: 25,
    icon: Rocket,
    isRecommended: false,
    color: 'bg-orange-50 text-orange-600',
    description: "Best value for dedicated learners.",
    features: [
      { text: '25 AI Interviews', included: true },
      { text: 'Access to analyzed feedback (pdf)', included: true },
      { text: 'Direct Access to Project Map', included: true },
      { text: 'Access to Interview Replay', included: true },
      { text: 'Access to Code Editor', included: true },
      { text: 'Access to highlighted clips', included: true }
    ]
  }
];

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const [showPromoInput, setShowPromoInput] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const { refreshUser, isAuthenticated, user } = useAuthStore();

  // ✅ Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated) return;

      try {
        const res = await mainApi.get(
          "/payment/interview-status"
        );

        if (res.data.subscription && res.data.subscription.interviewsTotal > 0) {
          setCurrentPlan(res.data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch subscription", err);
      }
    };

    fetchSubscription();
  }, [isAuthenticated]);

  // Validate promo code
  const validatePromoCode = async (planId) => {
    if (!promoCode.trim()) {
      setPromoValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const { data } = await mainApi.post(
        "/promo/validate",
        { code: promoCode, planId }
      );

      if (data.valid) {
        setPromoValidation({
          valid: true,
          ...data.pricing,
          code: data.promoCode.code,
          description: data.promoCode.description,
        });

        // Refresh order details with promo applied
        try {
          const orderData = await mainApi.post("/payment/create-order", { planId, promoCode });
          setOrderDetails({
            originalAmount: orderData.data.originalAmount,
            upgradeDiscount: orderData.data.upgradeDiscount || 0,
            discountAmount: orderData.data.discountAmount || 0,
            finalAmount: orderData.data.finalAmount,
            isUpgrade: orderData.data.isUpgrade || false,
            promoCode: orderData.data.promoCode
          });
        } catch (err) {
          console.error("Failed to refresh order details:", err);
        }
      }
    } catch (err) {
      setPromoValidation({
        valid: false,
        message: err.response?.data?.message || "Invalid promo code",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // ✅ Razorpay Payment Handler
  const handlePaymentWithPlan = async (planId) => {
    if (!isAuthenticated) {
      setModalType('login');
      setShowAuthModal(true);
      return;
    }

    if (!user?.isVerified) {
      setModalType('verify');
      setShowAuthModal(true);
      return;
    }

    // Guard: Razorpay SDK must be loaded
    if (typeof window.Razorpay === "undefined") {
      console.error("[PAYMENT] Razorpay SDK not loaded — checkout.js script missing or blocked");
      setPaymentError("Payment service is not available. Please refresh the page and try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError("");

    try {
      const requestData = { planId };
      if (promoCode.trim() && promoValidation?.valid) {
        requestData.promoCode = promoCode;
      }

      console.log("[PAYMENT] Starting payment", { planId, hasPromo: Boolean(requestData.promoCode) });

      const { data } = await mainApi.post("/payment/create-order", requestData);

      console.log("[PAYMENT] Order created successfully", { orderId: data.orderId, amount: data.amount });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Prepvio AI",
        description: `${data.planName} - ${data.interviews} Interviews`,
        handler: async function (response) {
          try {
            const verifyRes = await mainApi.post("/payment/verify", response);

            if (verifyRes.data.success) {
              await refreshUser();

              const res = await mainApi.get("/payment/interview-status");
              if (res.data.subscription) {
                setCurrentPlan(res.data.subscription);
              }

              setPaymentData({
                planName: verifyRes.data.subscription.planName,
                interviews: verifyRes.data.interviews.remaining,
              });
              setPaymentSuccess(true);
              setPaymentError("");
            }
          } catch (err) {
            console.error("[PAYMENT] Verification error:", err);
            setPaymentError("Payment completed but verification failed. Please contact support with your payment ID.");
          } finally {
            setIsProcessing(false);
            setSelectedPlan(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#1A1A1A" },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setSelectedPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("[PAYMENT] Order creation failed:", err);
      setPaymentError(err.response?.data?.message || "We couldn't start your payment. Please try again.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePlanSelect = async (planId) => {
    if (!isAuthenticated) {
      setModalType('login');
      setShowAuthModal(true);
      return;
    }

    if (!user?.isVerified) {
      setModalType('verify');
      setShowAuthModal(true);
      return;
    }

    // Prevent multiple clicks
    if (isCalculatingPrice || isProcessing) return;

    setIsCalculatingPrice(true);
    setSelectedPlan(planId);
    setPromoCode("");
    setPromoValidation(null);
    setOrderDetails(null);

    // Fetch order details to show upgrade pricing
    try {
      const { data } = await mainApi.post("/payment/create-order", { planId });
      setOrderDetails({
        originalAmount: data.originalAmount,
        upgradeDiscount: data.upgradeDiscount || 0,
        discountAmount: data.discountAmount || 0,
        finalAmount: data.finalAmount,
        isUpgrade: data.isUpgrade || false,
        promoCode: data.promoCode
      });
      setShowPromoInput(true);
    } catch (err) {
      console.error("[PAYMENT] Failed to fetch order details:", err);
      setPaymentError(err.response?.data?.message || "Failed to calculate plan price. Please try again.");
      setSelectedPlan(null);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const proceedToPayment = () => {
    if (selectedPlan) {
      setShowPromoInput(false);
      handlePaymentWithPlan(selectedPlan);
    }
  };


  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type={modalType}
      />
      <div className="max-w-[1600px] mx-auto px-6 ">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-30"
        >
          {/* Eyebrow */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Choose Your Plan</h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Get interview-ready in days, not weeks. Start now.
            </p>
          </div>

        </motion.div>




        {/* --- PRICING CARDS --- */}
        {/* Error Banner */}
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 flex items-start gap-3 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{paymentError}</span>
            <button onClick={() => setPaymentError("")} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <motion.div
          id="pricing-cards"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto"
        >
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isDark = plan.isRecommended;
            const isCurrentPlan = currentPlan?.active && currentPlan?.planId === plan.id;
            const hasCreditsRemaining = isCurrentPlan && currentPlan.interviewsRemaining > 0;
            const disableButton = isCurrentPlan && hasCreditsRemaining;

            return (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className={`
                relative rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 flex flex-col h-full
                ${isDark
                    ? 'bg-[#1A1A1A] text-white shadow-2xl shadow-gray-900/40 lg:scale-110 z-10 ring-1 ring-white/10'
                    : 'bg-white border border-gray-100 text-gray-900 shadow-xl shadow-gray-200/50 hover:border-gray-300'
                  }
              `}
              >
                {/* Popular Badge */}
                {isDark && (
                  <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                    <div className="bg-[#D4F478] text-black text-xs font-black px-6 py-2 rounded-full shadow-lg tracking-widest uppercase border-4 border-[#FDFBF9]">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className="mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${plan.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {(() => {
                      const tierOrder = { 'monthly': 0, 'premium': 1, 'yearly': 2 };
                      const currentTier = currentPlan?.active ? tierOrder[currentPlan.planId] : -1;
                      const planTier = tierOrder[plan.id];
                      if (currentPlan?.active && planTier > currentTier) {
                        return (
                          <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Upgrade
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className={`text-sm font-medium mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    {(() => {
                      const tierOrder = { 'monthly': 0, 'premium': 1, 'yearly': 2 };
                      const currentTier = currentPlan?.active ? tierOrder[currentPlan.planId] : -1;
                      const planTier = tierOrder[plan.id];
                      if (currentPlan?.active && planTier > currentTier) {
                        // If it's an upgrade, we could show a strike-through original if we had it, 
                        // but for now let's just keep it clean or show a hint.
                        // The modal will show the exact calculation.
                      }
                    })()}
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className={`text-lg font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {plan.duration}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className={`h-px w-full mb-8 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-0.5 ${feature.included
                        ? (isDark ? 'bg-[#D4F478] text-black' : 'bg-green-100 text-green-600')
                        : 'bg-red-50 text-red-400'
                        }`}>
                        {feature.included ? (
                          <Check className="w-3 h-3" strokeWidth={4} />
                        ) : (
                          <X className="w-3 h-3" strokeWidth={4} />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${feature.included
                        ? (isDark ? 'text-gray-300' : 'text-gray-600')
                        : 'text-gray-400 line-through decoration-gray-300'
                        }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={disableButton || (isProcessing && selectedPlan === plan.id)}
                  className={`
                  w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2
                  ${disableButton
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : isProcessing && selectedPlan === plan.id
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : isDark
                          ? 'bg-[#D4F478] text-black hover:bg-white hover:scale-[1.02] cursor-pointer'
                          : 'bg-[#1A1A1A] text-white hover:bg-gray-800 cursor-pointer'
                    }
                `}
                >
                  {disableButton ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Current Plan
                    </>
                  ) : (isProcessing || isCalculatingPrice) && selectedPlan === plan.id ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Choose {plan.name}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* PROMO CODE MODAL */}
      <AnimatePresence>
        {showPromoInput && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPromoInput(false);
              setSelectedPlan(null);
              setPromoCode("");
              setPromoValidation(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {(() => {
                const plan = plans.find(p => p.id === selectedPlan);
                if (!plan) return null;

                return (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
                        {plan.name}
                        {orderDetails?.isUpgrade && (
                          <span className="text-[10px] bg-[#EEF2FF] text-[#4F46E5] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">
                            Upgrade
                          </span>
                        )}
                      </h3>
                      <p className="text-4xl font-black text-gray-900">
                        ₹{orderDetails?.finalAmount || plan.priceValue}
                      </p>
                      {orderDetails && (orderDetails.upgradeDiscount > 0 || orderDetails.discountAmount > 0) && (
                        <p className="text-sm text-gray-500 line-through">
                          Original: ₹{orderDetails.originalAmount}
                        </p>
                      )}
                    </div>

                    {/* Price Breakdown - Always Visible if Order Details exist */}
                    {orderDetails && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-gray-600" />
                          Price Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Plan Price:</span>
                            <span className="font-bold">₹{orderDetails.originalAmount}</span>
                          </div>

                          {orderDetails.isUpgrade && (
                            <div className="flex justify-between text-[#4F46E5] bg-[#EEF2FF] p-2.5 rounded-xl">
                              <span className="flex items-center gap-1 font-bold"><Zap className="w-3.5 h-3.5" /> Upgrade Discount:</span>
                              <span className="font-black">-₹{orderDetails.upgradeDiscount}</span>
                            </div>
                          )}

                          {orderDetails.discountAmount > 0 && (
                            <div className="flex justify-between text-green-700 bg-green-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Promo Applied:</span>
                              <span className="font-bold">-₹{orderDetails.discountAmount}</span>
                            </div>
                          )}

                          <div className="h-px bg-gray-200 my-2"></div>
                          <div className="flex justify-between items-center text-gray-900 font-extrabold text-xl pt-1">
                            <span>Total To Pay:</span>
                            <span className="text-[#22c55e]">₹{orderDetails.finalAmount}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-50 to-transparent rounded-full blur-2xl opacity-50" />

                      <label className="block text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                        <span className="text-lg">🎁</span> Have a promo code?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            setPromoValidation(null);
                          }}
                          placeholder="Enter PREP29"
                          autoComplete="off"
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none font-medium"
                        />
                        <button
                          onClick={() => validatePromoCode(selectedPlan)}
                          disabled={!promoCode.trim() || isValidating}
                          className={`px-8 py-3 rounded-2xl font-black transition-all active:scale-95 ${promoCode.trim()
                            ? 'bg-[#1A1A1A] text-white hover:bg-black shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          {isValidating ? '...' : 'Apply'}
                        </button>
                      </div>

                      {promoValidation && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 p-3 rounded-xl ${promoValidation.valid
                            ? 'bg-green-100 border-2 border-green-300 text-green-800'
                            : 'bg-red-100 border-2 border-red-300 text-red-800'
                            }`}
                        >
                          {promoValidation.valid ? (
                            <div>
                              <p className="font-bold text-sm mb-1">{promoValidation.code} Applied Successfully</p>
                              <p className="text-xs mb-2">
                                {promoValidation.code === 'PREP29'
                                  ? "This plan includes all features enabled and 2 interviews."
                                  : promoValidation.description}
                              </p>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span>Original:</span>
                                  <span className="line-through">₹{promoValidation.originalAmount}</span>
                                </div>
                                <div className="flex justify-between font-bold text-green-700">
                                  <span>Discount:</span>
                                  <span>-₹{promoValidation.discountAmount}</span>
                                </div>
                                <div className="flex justify-between font-black text-lg">
                                  <span>Final:</span>
                                  <span>₹{promoValidation.finalAmount}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-bold">❌ {promoValidation.message}</p>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={proceedToPayment}
                        disabled={isProcessing}
                        className="flex-1 bg-[#1A1A1A] text-white font-black py-4 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : `Pay ₹${orderDetails?.finalAmount || plan.priceValue}`}
                      </button>
                      <button
                        onClick={() => {
                          setShowPromoInput(false);
                          setSelectedPlan(null);
                          setPromoCode("");
                          setPromoValidation(null);
                        }}
                        className="px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-xs font-bold text-yellow-800 mb-1">PREP29 applied successfully</p>
                      <p className="text-xs text-yellow-700">This plan includes all features enabled and 2 interviews.</p>
                    </div> */}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT SUCCESS POPUP */}
      <AnimatePresence>
        {paymentSuccess && paymentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl text-center"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>

              {/* Success Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-gray-900 mb-3"
              >
                Payment Successful!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8"
              >
                Welcome to <span className="font-bold text-gray-900">{paymentData.planName}</span>
                <br />
                You have <span className="font-bold text-green-600">{paymentData.interviews} interviews</span> ready to use!
              </motion.p>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => window.location.href = "/services/check-your-ability/interview"}
                className="w-full bg-[#1A1A1A] text-white font-bold py-4 px-6 rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Practicing Now
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};



// ✅ HERO COMPONENT
const Hero = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => { setActiveStep((prev) => (prev === 0 ? 1 : 0)); }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-[1600px] mx-auto bg-white/40 backdrop-blur-xl rounded-[3.5rem] p-6 md:p-10 lg:p-12 border border-white/60 shadow-2xl shadow-gray-200/50 relative overflow-hidden z-10 -mt-5">
      <FloatingDecoration />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 lg:mt-10 min-h-[600px]">
        <div className="lg:col-span-5 flex flex-col justify-between gap-8 lg:gap-0"><div className="flex-grow flex flex-col justify-center"><HeroTextSection /></div><div className="mt-8 lg:mt-0"><AgentCard /></div></div>
        <div className="lg:col-span-7 relative h-full min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeStep === 0 ? (
              <motion.div key="trio" variants={switchVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8 h-full">
                <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8"><div className="flex-grow"><InfoCard /></div><div className="flex-grow"><HeroServicesCard /></div></div>
                <div className="lg:col-span-3"><SuccessStoryCard /></div>
              </motion.div>
            ) : (<HeroVisual key="visual" />)}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ✅ MAIN HOME COMPONENT
const Home = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF9] p-3 md:p-6 font-sans selection:bg-[#D4F478] selection:text-black overflow-x-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-50"><div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" /><div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" /></div>

      <Header />

      <div className="flex flex-col gap-8 mt-0">
        <Hero />
        <PartnersSection />
        <ProblemSection />

        <div id="explore" className="scroll-mt-24">
          <ZigZagServices />
        </div>

        <div id="about" className="scroll-mt-24">
          <AboutUs />
        </div>

        <div id="pricing" className="scroll-mt-24">
          <PricingSection />
        </div>

        <div id="faqs" className="scroll-mt-24">
          <FAQSection />
        </div>
      </div>

      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 30s linear infinite; } .perspective-1000 { perspective: 1000px; }`}</style>
    </div>
  );
};

export default Home;