import React from "react";
import { useAuthStore } from "../store/authstore.js";

import { motion } from "framer-motion";
import {
  Bot,
  BarChart3,
  FileText,
  Target,
  Zap,
  ShieldCheck,
  Gift,
  Sparkles,
  ArrowRight,
  LogIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Updated Features Data with more aggressive, professional copy
const features = [
  {
    title: "Real-Time AI Interviewer with Emotion Detection",
    description:
      "Face realistic interviews while AI tracks your responses and body language. Get flagged for nervousness, poor eye contact, or uncertainty with visual proof",
    icon: <Bot className="w-7 h-7" />,
    color: "bg-blue-100",
  },
  {
    title: "Deep Response Analysis",
    description:
      "Get instant feedback on every answer: clarity, structure, technical accuracy, and communication style. See exactly what worked and what didn't - question by question.",
    icon: <BarChart3 className="w-7 h-7" />,
    color: "bg-[#D4F478]", // Using the signature lime-green
  },
  {
    title: "Detailed Performance Report",
    description:
      "Receive a comprehensive breakdown with timestamped feedback, improvement suggestions, and talking points to refine. Track your progress across multiple practice sessions.",
    icon: <FileText className="w-7 h-7" />,
    color: "bg-purple-100",
  },
];

const FeatureCard = ({ icon, title, description, color }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl shadow-gray-100 flex flex-col items-start text-left gap-4 hover:bg-white transition-all group"
  >
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-gray-800 shadow-sm group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm font-medium">
      {description}
    </p>
  </motion.div>
);

const AboutUs = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore(); // ✅ Added isAuthenticated
  const hasInterviewCredits = user?.subscription?.interviewsRemaining > 0;

  return (
    <div className="bg-[#F8F9FB] py-20 overflow-hidden">
      {/* ✅ Dominate Your Interview Section */}
      <section id="features" className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm mb-6"
          >
            <Zap className="w-4 h-4 text-[#D4F478] fill-[#D4F478]" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Next-Gen Preparation</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">
            Dominate Your <br />
            <span className="text-gray-400">Interview Process</span>
          </h2>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            Master every interview with AI that adapts to your role and company. <br /> We don't just help you practice, we help you win.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </div>

        {/* ================= INTERVIEW CTA ================= */}
        {!isAuthenticated ? (
          /* ===== NOT LOGGED IN ===== */
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20 p-10 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] rounded-[3.5rem] relative overflow-hidden shadow-2xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4F478]/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left */}
              <div className="flex items-start gap-6 flex-1">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4F478] to-[#B8E356] rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-10 h-10 text-black" />
                </div>

                <div>
                  <h4 className="text-3xl font-black text-white mb-3">
                    Get Your First Interview Free!
                  </h4>
                  <p className="text-gray-400 text-lg">
                    Sign up now and start practicing with our AI-powered interview simulator.{" "}
                    <span className="text-[#D4F478] font-bold">No credit card required.</span>
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-[#D4F478] text-black px-8 py-4 rounded-full font-black hover:scale-[1.02] transition-transform flex items-center gap-2 justify-center shadow-lg shadow-[#D4F478]/20"
                >
                  <LogIn className="w-5 h-5" />
                  Login Now
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="px-8 py-3 rounded-full border-2 border-white/20 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2 justify-center"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : hasInterviewCredits ? (
          /* ===== HAS CREDITS ===== */
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20 p-10 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] rounded-[3.5rem] relative overflow-hidden shadow-2xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4F478]/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left */}
              <div className="flex items-start gap-6 flex-1">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4F478] to-[#B8E356] rounded-2xl flex items-center justify-center shadow-xl">
                  <Gift className="w-10 h-10 text-black" />
                </div>

                <div>
                  <h4 className="text-3xl font-black text-white mb-2">
                    You've Got Interview Credits
                  </h4>
                  <p className="text-gray-400 text-lg">
                    You have{" "}
                    <span className="text-[#D4F478] font-bold">
                      {user.subscription.interviewsRemaining}
                    </span>{" "}
                    interview credit(s) remaining.
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/services/check-your-ability/interview")}
                  className="bg-[#D4F478] text-black px-8 py-4 rounded-full font-black hover:scale-[1.02] transition-transform shadow-lg cursor-pointer"
                >
                  Start Interview
                </button>

                <button
                  onClick={() => navigate("/dashboard/pricing")}
                  className="px-8 py-3 rounded-full border-2 border-white/20 text-white font-bold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Get More Credits
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ===== NO CREDITS (but authenticated) ===== */
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20 p-10 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] rounded-[3.5rem] relative overflow-hidden shadow-2xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 text-center">
              {/* <div className="inline-flex w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl items-center justify-center shadow-xl mb-6">
                <Target className="w-10 h-10 text-white" />
              </div> */}

              <h4 className="text-3xl font-black text-white mb-4">
                You've Used All Interview Credits
              </h4>

              <p className="text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                Upgrade your plan to unlock more AI-powered interviews with detailed feedback.
              </p>

              <button
                onClick={() => navigate("/dashboard/pricing")}
                className="bg-[#D4F478] text-black px-10 py-4 rounded-full font-black hover:scale-[1.02] transition-transform shadow-lg shadow-[#D4F478]/20"
              >
                Upgrade & Get Credits
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default AboutUs;