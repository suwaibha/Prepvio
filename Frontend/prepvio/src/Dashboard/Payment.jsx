import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { mainApi } from "../utils/apiClient";
import { jsPDF } from "jspdf";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import {
  Check,
  X,
  Zap,
  Crown,
  Rocket,
  ShieldCheck,
  Smartphone,
  Globe,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  Calendar,
  TrendingUp,
  AlertCircle,
  FileText
} from "lucide-react";
import { useAuthStore } from "../store/authstore";



// --- PLANS DATA ---
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

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

function Payment() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('pricing');
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const { user, refreshUser } = useAuthStore();
  const { setMobileOpen } = useOutletContext();

  // ✅ Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await mainApi.get(
          "/payment/interview-status"
        );

        // ✅ Show subscription even if it's free plan with 1 credit
        if (res.data.subscription && res.data.subscription.interviewsTotal > 0) {
          setCurrentPlan(res.data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch subscription", err);
      }
    };

    fetchSubscription();
    fetchSubscription();
  }, [paymentSuccess]);

  // Fetch Payment History
  useEffect(() => {
    if (activeTab === 'paid-bills') {
      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          const res = await mainApi.get("/payment/history");
          if (res.data.success) {
            setPaymentHistory(res.data.history);
          }
        } catch (err) {
          console.error("Failed to fetch payment history", err);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchHistory();
    }
  }, [activeTab]);

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

  // Generate and Download Invoice
  const handleDownloadInvoice = (payment) => {
    const doc = new jsPDF();

    // -- Styling Constants --
    const primaryColor = [26, 26, 26]; // #1A1A1A (Black)
    const accentColor = [212, 244, 120]; // #D4F478 (Lime)
    const grayColor = [107, 114, 128]; // Gray-500

    // -- Header --
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PREPVIO", 20, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", 180, 25, { align: "right" });

    // -- Invoice Details --
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO:", 20, 60);

    doc.setFont("helvetica", "normal");
    doc.text(user?.name || "Valued Customer", 20, 66);
    doc.text(user?.email || "", 20, 72);

    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS:", 120, 60);

    doc.setFont("helvetica", "normal");
    const date = new Date(payment.paidAt || payment.updatedAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    doc.text(`Invoice ID:`, 120, 66);
    doc.text(`${payment.orderId.split('_')[1] || payment.orderId}`, 160, 66);

    doc.text(`Date:`, 120, 72);
    doc.text(`${date}`, 160, 72);

    doc.text(`Status:`, 120, 78);
    doc.setTextColor(0, 128, 0); // Green
    doc.text(`PAID`, 160, 78);

    // -- Table --
    doc.setTextColor(...primaryColor);
    const startY = 100;

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, startY, 170, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", 25, startY + 7);
    doc.text("AMOUNT (INR)", 185, startY + 7, { align: "right" });

    // Table Content
    const planName = payment.planId === 'monthly' ? 'Basic Plan' :
      payment.planId === 'premium' ? 'Pro Access' :
        payment.planId === 'yearly' ? 'Premium Plan' : payment.planId;

    doc.setFont("helvetica", "normal");
    doc.text(`${planName} Subscription`, 25, startY + 20);
    doc.text(`Rs. ${payment.amount}`, 185, startY + 20, { align: "right" });

    if (payment.promoCode) {
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(`Promo Code Applied: ${payment.promoCode}`, 25, startY + 26);
    }

    // -- Total --
    doc.setDrawColor(200, 200, 200);
    doc.line(20, startY + 35, 190, startY + 35);

    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 140, startY + 45);
    doc.text(`Rs. ${payment.amount}`, 185, startY + 45, { align: "right" });

    // -- Footer --
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for choosing PrepVio for your interview preparation.", 105, 270, { align: "center" });
    doc.text("For any queries, please verify at prepvio.in", 105, 275, { align: "center" });

    // Save
    doc.save(`Prepvio_Invoice_${payment.orderId}.pdf`);
  };

  // Razorpay Payment Handler
  const handlePaymentWithPlan = async (planId) => {
    setIsProcessing(true);
    setPaymentError("");

    // Guard: Razorpay SDK must be loaded
    if (typeof window.Razorpay === "undefined") {
      console.error("[PAYMENT] Razorpay SDK not loaded — checkout.js script missing or blocked");
      setPaymentError("Payment service is not available. Please refresh the page and try again.");
      setIsProcessing(false);
      setSelectedPlan(null);
      return;
    }

    try {
      const requestData = { planId };
      if (promoCode.trim() && promoValidation?.valid) {
        requestData.promoCode = promoCode;
      }

      console.log("[PAYMENT] Starting payment", { planId, hasPromo: Boolean(requestData.promoCode) });

      const { data } = await mainApi.post("/payment/create-order", requestData);

      console.log("[PAYMENT] Order created successfully", { orderId: data.orderId, amount: data.amount });

      // Store order details for display (includes upgrade pricing info)
      const currentOrderDetails = {
        originalAmount: data.originalAmount,
        upgradeDiscount: data.upgradeDiscount || 0,
        discountAmount: data.discountAmount || 0,
        finalAmount: data.finalAmount,
        isUpgrade: data.isUpgrade || false,
        promoCode: data.promoCode
      };

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Prepvio AI",
        description: `${data.planName} - ${data.interviews} Interviews${currentOrderDetails.isUpgrade ? ' (Upgrade)' : ''}`,
        handler: async function (response) {
          try {
            const verifyRes = await mainApi.post("/payment/verify", response);

            if (verifyRes.data.success) {
              await refreshUser();
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
      const msg = err.response?.data?.message || "We couldn't start your payment. Please try again.";
      setPaymentError(msg);
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePlanSelect = async (planId) => {
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

  // Original pricing page
  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black relative overflow-hidden">

      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      {/* --- BACKGROUND DECORATION --- */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70"
          style={{ animation: 'blob 7s infinite' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70"
          style={{ animation: 'blob 7s infinite 2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-70"
          style={{ animation: 'blob 7s infinite 4s' }}
        />
      </div>

      <style>
        {`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-16">

        {/* --- TAB NAVIGATION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="inline-flex gap-4 bg-white rounded-2xl p-1.5 border border-gray-200 shadow-md">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'pricing'
                ? 'bg-[#D4F478] text-black shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Pricing Plans
            </button>
            {currentPlan?.active && (
              <button
                onClick={() => setActiveTab('current-plan')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'current-plan'
                  ? 'bg-[#D4F478] text-black shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Current Plan
              </button>
            )}
            <button
              onClick={() => setActiveTab('paid-bills')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'paid-bills'
                ? 'bg-[#D4F478] text-black shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Paid Bills
            </button>
          </div>
        </motion.div>

        {/* --- HEADER --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full text-sm font-bold text-gray-600 shadow-sm mb-2">
            <Lock className="w-3.5 h-3.5" /> Secure & Encrypted Payment
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
            {activeTab === 'pricing' ? (
              <>Invest in your <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Future Today.</span></>
            ) : activeTab === 'current-plan' ? (
              <>Your <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Active Plan</span></>
            ) : (
              <>Payment <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">History</span></>
            )}
          </h1>
          <p className="text-gray-500 text-lg md:text-xl font-medium max-w-xl mx-auto">
            {activeTab === 'pricing'
              ? 'Unlock access to AI-powered interview prep and career-boosting tools.'
              : activeTab === 'current-plan'
                ? 'Manage your subscription and track your remaining credits.'
                : 'View your complete payment history and invoices.'}
          </p>
        </motion.div>

        {/* ✅ CURRENT PLAN TAB */}
        {activeTab === 'current-plan' && currentPlan?.active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Main Status Card */}
            <div className={`relative overflow-hidden rounded-3xl p-8 shadow-xl border-2 ${currentPlan.interviewsRemaining > 0
              ? 'bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 border-green-200'
              : 'bg-gradient-to-br from-white via-red-50/30 to-orange-50/50 border-red-200'
              }`}>

              {/* Decorative blob */}
              <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${currentPlan.interviewsRemaining > 0 ? 'bg-green-400' : 'bg-red-400'
                }`} />

              <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${currentPlan.interviewsRemaining > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`} />
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                        Active Plan
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-1">
                      {currentPlan.planName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Expires: {new Date(currentPlan.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Credits Display - BIG & CLEAR */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Interview Credits
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-6xl font-black tabular-nums ${currentPlan.interviewsRemaining > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {currentPlan.interviewsRemaining}
                        </span>
                        <span className="text-2xl font-bold text-gray-400">
                          left
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 font-medium">
                        Started with {currentPlan.interviewsTotal} credits
                      </p>
                    </div>

                    {/* Visual Indicator */}
                    <div className="flex flex-col items-center">
                      {currentPlan.interviewsRemaining > 0 ? (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Usage
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {currentPlan.interviewsTotal - currentPlan.interviewsRemaining} used
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((currentPlan.interviewsTotal - currentPlan.interviewsRemaining) / currentPlan.interviewsTotal) * 100}%`
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${currentPlan.interviewsRemaining > 0
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-red-400 to-orange-500'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Messages - Clear & Action-Oriented */}
                {currentPlan.interviewsRemaining === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-red-900 mb-1">
                        No Credits Remaining
                      </h4>
                      <p className="text-sm text-red-700 font-medium mb-3">
                        You've used all your interview credits. Upgrade your plan to continue practicing!
                      </p>
                      <button
                        onClick={() => setActiveTab('pricing')}
                        className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Upgrade Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentPlan.interviewsRemaining > 0 && currentPlan.interviewsRemaining <= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-orange-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-orange-900 mb-1">
                        Running Low on Credits
                      </h4>
                      <p className="text-sm text-orange-700 font-medium mb-3">
                        Only {currentPlan.interviewsRemaining} {currentPlan.interviewsRemaining === 1 ? 'credit' : 'credits'} left. Consider upgrading to keep practicing without interruption.
                      </p>
                      <button
                        onClick={() => setActiveTab('pricing')}
                        className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        View Plans
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentPlan.interviewsRemaining > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-green-900 mb-1">
                        You're All Set!
                      </h4>
                      <p className="text-sm text-green-700 font-medium">
                        You have {currentPlan.interviewsRemaining} interview credits available. Start practicing now!
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ✅ PAID BILLS TAB */}
        {activeTab === 'paid-bills' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  Payment History
                </h3>
              </div>

              {historyLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Loading your payment history...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h4>
                  <p className="text-gray-500 max-w-xs mx-auto mb-8">
                    You haven't made any payments yet. Choose a plan to get started!
                  </p>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="bg-[#D4F478] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform"
                  >
                    View Plans
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt ID</th>
                        <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentHistory.map((payment) => (
                        <tr key={payment._id || payment.orderId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {new Date(payment.paidAt || payment.updatedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5">
                              {new Date(payment.paidAt || payment.updatedAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payment.planId === 'premium' ? 'bg-[#D4F478] text-black' :
                                payment.planId === 'yearly' ? 'bg-orange-100 text-orange-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                {payment.planId === 'premium' ? <Crown className="w-4 h-4" /> :
                                  payment.planId === 'yearly' ? <Rocket className="w-4 h-4" /> :
                                    <Zap className="w-4 h-4" />}
                              </div>
                              <span className="font-bold text-gray-900 capitalize">
                                {payment.planId === 'monthly' ? 'Basic Plan' :
                                  payment.planId === 'premium' ? 'Pro Access' :
                                    payment.planId === 'yearly' ? 'Premium Plan' : payment.planId}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="font-black text-gray-900">
                              ₹{payment.amount}
                            </div>
                            {payment.promoCode && (
                              <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                {payment.promoCode} APPLIED
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md select-all">
                              {payment.orderId.split('_')[1] || payment.orderId}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDownloadInvoice(payment)}
                              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-end gap-1 ml-auto group"
                            >
                              Download
                              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ✅ PRICING CARDS TAB */}
        {activeTab === 'pricing' && (
          <>
            {/* Error banner */}
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 flex items-start gap-3 text-sm font-medium"
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start justify-center"
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
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`text-sm font-medium mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
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
                          : isCalculatingPrice && selectedPlan === plan.id
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
                        <ArrowRight className="w-4 h-4 transition-transform hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
          </>
        )}

        {/* --- TRUST INDICATORS --- */}
        {activeTab === 'pricing' && (
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-gray-400"><ShieldCheck className="w-6 h-6" /> SSL Secure</div>
            <div className="flex items-center gap-2 font-bold text-gray-400"><Globe className="w-6 h-6" /> Global Access</div>
            <div className="flex items-center gap-2 font-bold text-gray-400"><Smartphone className="w-6 h-6" /> Mobile Ready</div>
          </div>
        )}

      </div>

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
              exit={{ scale: 0.9, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {(() => {
                const plan = plans.find(p => p.id === selectedPlan);
                if (!plan) return null;

                return (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        {plan.name}
                        {orderDetails?.isUpgrade && (
                          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
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
                            <div className="flex justify-between text-blue-700 bg-blue-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Upgrade Discount:</span>
                              <span className="font-bold">-₹{orderDetails.upgradeDiscount}</span>
                            </div>
                          )}

                          {orderDetails.discountAmount > 0 && (
                            <div className="flex justify-between text-green-700 bg-green-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Promo Applied:</span>
                              <span className="font-bold">-₹{orderDetails.discountAmount}</span>
                            </div>
                          )}

                          <div className="h-px bg-gray-300 my-2"></div>
                          <div className="flex justify-between text-gray-900 font-black text-lg">
                            <span>Total To Pay:</span>
                            <span className="text-green-600">₹{orderDetails.finalAmount}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Promo Code Input */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-dashed border-green-300">
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        🎁 Have a promo code?
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
                          className={`px-6 py-3 rounded-xl font-bold transition-all ${promoCode.trim()
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          {isValidating ? 'Checking...' : 'Apply'}
                        </button>
                      </div>

                      {/* Validation Message */}
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
                              <p className="font-bold text-sm mb-1">
                                {promoValidation.code} Applied Successfully
                              </p>
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={proceedToPayment}
                        disabled={isProcessing}
                        className="flex-1 bg-[#1A1A1A] text-white font-bold py-4 px-6 rounded-2xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : `Pay ₹${orderDetails?.finalAmount || plan.priceValue}`}
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
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Payment;