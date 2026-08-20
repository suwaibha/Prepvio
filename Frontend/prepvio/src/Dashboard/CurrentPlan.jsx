import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { mainApi } from "../utils/apiClient";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Lock,
  Zap,
  Crown,
  Rocket,
  Trophy,
  Clock,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "../store/authstore";



function CurrentPlan() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuthStore();

  // Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const res = await mainApi.get(
          "/payment/interview-status"
        );

        if (res.data.success && res.data.subscription) {
          setCurrentPlan(res.data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch subscription", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  // Get plan icon based on planId
  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free': return Zap;
      case 'monthly': return Zap;
      case 'premium': return Crown;
      case 'yearly': return Rocket;
      case 'lifetime': return Trophy;
      default: return Zap;
    }
  };

  // Get plan color based on status
  const getStatusColor = (remaining) => {
    if (remaining <= 0) return 'red';
    if (remaining <= 2) return 'orange';
    return 'green';
  };

  // Refresh subscription data
  const handleRefresh = async () => {
    await refreshUser();
    const res = await mainApi.get(
      "/payment/interview-status"
    );
    if (res.data.success && res.data.subscription) {
      setCurrentPlan(res.data.subscription);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-1/3 mb-8"></div>
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!currentPlan || !currentPlan.active) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 shadow-2xl border border-gray-800 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4F478]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#D4F478]/10 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    No Active Plan
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white mb-2">
                  Get Started with Prepvio AI
                </h3>
                <p className="text-gray-400 font-medium">
                  Claim your free session or choose a plan to start practicing interviews
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
              <div className="flex items-center justify-center gap-6 py-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-4 border-gray-700">
                  <Lock className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white mb-3">
                    No Interview Credits Available
                  </h4>
                  <p className="text-gray-400 font-medium mb-6">
                    You need to have an active subscription to start AI-powered interview practice
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => window.location.href = "/claim-free-session"}
                      className="bg-gradient-to-r from-[#D4F478] to-[#B8E356] text-black font-bold px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform flex items-center gap-2 group"
                    >
                      <Sparkles className="w-5 h-5" />
                      Claim Free Session
                    </button>
                    <button
                      onClick={() => window.location.href = "/pricing"}
                      className="bg-gray-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 group"
                    >
                      View Plans
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const PlanIcon = getPlanIcon(currentPlan.planId);
  const statusColor = getStatusColor(currentPlan.interviewsRemaining);
  const colorClasses = {
    red: {
      bg: 'from-red-900/20 to-red-950/10',
      border: 'border-red-800/30',
      text: 'text-red-400',
      accent: 'bg-gradient-to-br from-red-500 to-orange-500',
      iconBg: 'bg-red-900/30',
      statusBg: 'bg-red-900/20',
      statusBorder: 'border-red-800/20',
      button: 'bg-red-600 hover:bg-red-700'
    },
    orange: {
      bg: 'from-orange-900/20 to-orange-950/10',
      border: 'border-orange-800/30',
      text: 'text-orange-400',
      accent: 'bg-gradient-to-br from-orange-500 to-yellow-500',
      iconBg: 'bg-orange-900/30',
      statusBg: 'bg-orange-900/20',
      statusBorder: 'border-orange-800/20',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    green: {
      bg: 'from-emerald-900/20 to-emerald-950/10',
      border: 'border-emerald-800/30',
      text: 'text-emerald-400',
      accent: 'bg-gradient-to-br from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-900/30',
      statusBg: 'bg-emerald-900/20',
      statusBorder: 'border-emerald-800/20',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    }
  }[statusColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Main Plan Card */}
      <div className={`relative overflow-hidden rounded-3xl shadow-2xl border-2 ${colorClasses.border}`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.bg}`} />

        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-white/10 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${colorClasses.text}`} />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Active Plan
                  </span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="ml-4 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${colorClasses.iconBg} flex items-center justify-center border ${colorClasses.border}`}>
                  <PlanIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-1">
                    {currentPlan.planName}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Expires: {formatDate(currentPlan.endDate)}
                      </span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {Math.ceil((new Date(currentPlan.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credits Display */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Interview Credits
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-6xl md:text-7xl font-black tabular-nums ${colorClasses.text}`}>
                    {currentPlan.interviewsRemaining}
                  </span>
                  <div>
                    <span className="text-2xl font-bold text-gray-300 block">
                      / {currentPlan.interviewsTotal} total
                    </span>
                    <span className="text-sm text-gray-400 font-medium">
                      credits remaining
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 mt-4 font-medium">
                  Used {currentPlan.interviewsUsed} of {currentPlan.interviewsTotal} credits
                </p>
              </div>

              {/* Visual Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-2xl ${colorClasses.accent} flex items-center justify-center shadow-lg border-4 border-gray-900`}>
                  {currentPlan.interviewsRemaining > 0 ? (
                    <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="w-12 h-12 text-white" strokeWidth={2} />
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Usage Progress
                </span>
                <span className="text-sm font-bold text-gray-300">
                  {Math.round(((currentPlan.interviewsTotal - currentPlan.interviewsRemaining) / currentPlan.interviewsTotal) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentPlan.interviewsTotal - currentPlan.interviewsRemaining) / currentPlan.interviewsTotal) * 100}%`
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${colorClasses.accent}`}
                />
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className={`${colorClasses.statusBg} border ${colorClasses.statusBorder} rounded-2xl p-6`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${colorClasses.iconBg} flex items-center justify-center flex-shrink-0 border ${colorClasses.border}`}>
                {currentPlan.interviewsRemaining === 0 ? (
                  <Lock className="w-6 h-6 text-white" strokeWidth={2} />
                ) : currentPlan.interviewsRemaining <= 2 ? (
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2} />
                )}
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-black text-white mb-2">
                  {currentPlan.interviewsRemaining === 0 ? (
                    "No Credits Remaining"
                  ) : currentPlan.interviewsRemaining <= 2 ? (
                    "Running Low on Credits"
                  ) : (
                    "You're All Set!"
                  )}
                </h4>

                <p className="text-gray-300 font-medium mb-4">
                  {currentPlan.interviewsRemaining === 0 ? (
                    "You've used all your interview credits. Upgrade your plan to continue practicing!"
                  ) : currentPlan.interviewsRemaining <= 2 ? (
                    `Only ${currentPlan.interviewsRemaining} credit${currentPlan.interviewsRemaining === 1 ? '' : 's'} left. Consider upgrading to keep practicing without interruption.`
                  ) : (
                    `You have ${currentPlan.interviewsRemaining} interview credits available. Start practicing now!`
                  )}
                </p>

                <div className="flex flex-wrap gap-3">
                  {currentPlan.interviewsRemaining <= 2 && (
                    <button
                      onClick={() => window.location.href = "/pricing"}
                      className={`${colorClasses.button} text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 group`}
                    >
                      <TrendingUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                      {currentPlan.interviewsRemaining === 0 ? "Upgrade Now" : "View Plans"}
                    </button>
                  )}

                  {currentPlan.interviewsRemaining > 0 && (
                    <button
                      onClick={() => window.location.href = "/services/check-your-ability/interview"}
                      className="bg-gradient-to-r from-[#D4F478] to-[#B8E356] text-black font-bold px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform flex items-center gap-2 group"
                    >
                      Start Interview
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <button
                    onClick={() => window.location.href = "/dashboard"}
                    className="bg-gray-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CurrentPlan;