import React, { useState } from "react";
import { HelpCircle, Sparkles, Plus, Minus } from "lucide-react";

const FAQSection = () => {
  const [openId, setOpenId] = useState(null);

  const faqData = [
    { 
      id: 1, 
      q: "How does the AI analyze my performance?", 
      a: "Our AI tracks signals which includes speech clarity, body language, eye contact, nervous cues, and answer quality to give you comprehensive feedback on both what you say and how you say it." 
    },
    { 
      id: 2, 
      q: "Can I practice for specific companies?", 
      a: "Yes! Select your target company and role to get tailored questions that match their interview style, culture, and typical assessment areas." 
    },
    { 
      id: 3, 
      q: "Is my interview data private?", 
      a: "Yes. All recordings are encrypted and never shared. You control your data—view, download, or delete anytime. We never share your practice sessions with third parties."
    },
    { 
      id: 4, 
      q: "Do you support technical interviews?", 
      a: "We support live coding for DSA and AI-driven feedback on problem-solving approach." 
    },
    { 
      id: 5, 
      q: "Do I need any special equipment?", 
      a: "Just a webcam and microphone. Our platform works on any modern browser, no downloads or installations required." 
    },
    { 
      id: 6, 
      q: "Do you offer a free trial?", 
      a: "We offer one free interview, so you can experience the full platform before committing to a subscription." 
    },
  ];

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-[#EAE6F5] rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 md:p-16 relative overflow-hidden">

        {/* Background Blob */}
        <div className="absolute top-0 right-0 w-[320px] sm:w-[520px] h-[320px] sm:h-[520px] bg-purple-200/50 rounded-full blur-[110px] pointer-events-none" />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 relative z-10">

          {/* Sparkles Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm mb-4 sm:mb-6">
            <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#D4F478] fill-[#D4F478]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
              The Knowledge Hub
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 mb-3 sm:mb-4">
            Everything <span className="text-gray-400 italic">Answered.</span>
          </h2>

          {/* Subtext */}
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed px-4 sm:px-0">
            Clear, honest answers to the most important questions about our AI-powered interview platform.
          </p>
        </div>

        {/* MOBILE UI -> Accordion (lg:hidden) */}
        <div className="lg:hidden max-w-4xl mx-auto relative z-10 space-y-3 sm:space-y-4">
          {faqData.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              {/* Question Header - Clickable */}
              <button
                onClick={() => toggleFAQ(item.id)}
                className="w-full flex items-center justify-between p-5 sm:p-7 text-left group"
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  {/* Icon */}
                  <div className="bg-purple-50 p-2 sm:p-2.5 rounded-full mt-0.5 flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                    <HelpCircle className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
                  </div>
                  
                  {/* Question */}
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-black text-base sm:text-xl leading-snug tracking-tight pr-4">
                      {item.q}
                    </h3>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex-shrink-0 ml-2">
                  {openId === item.id ? (
                    <Minus className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600 transition-transform duration-300" />
                  ) : (
                    <Plus className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 group-hover:text-purple-600 transition-all duration-300" />
                  )}
                </div>
              </button>

              {/* Answer - Expandable */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openId === item.id 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 sm:px-7 pb-5 sm:pb-7">
                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-4 sm:mb-5" />
                  
                  {/* Answer Text */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Spacer to align with question */}
                    <div className="w-8 sm:w-9 flex-shrink-0" />
                    
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base font-medium">
                      {item.a}
                    </p>
                  </div>

                  {/* FAQ ID Badge */}
                  <div className="flex items-start gap-3 sm:gap-4 mt-4">
                    <div className="w-8 sm:w-9 flex-shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-1 rounded-full">
                      FAQ - {item.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP UI -> Marquee (hidden lg:block) */}
        <div className="hidden lg:block relative flex overflow-x-hidden group z-10">
          <div className="animate-marquee flex gap-6 items-stretch">
            {[...faqData, ...faqData].map((item, i) => (
              <div 
                key={i}
                className="bg-white rounded-[2.4rem] p-7 shadow-lg shadow-gray-200/50 flex flex-col gap-5 min-w-[320px] w-[320px] border border-gray-100 hover:scale-[1.03] transition-transform duration-300"
              >
                {/* Icon + ID */}
                <div className="flex justify-between items-center">
                  <div className="bg-purple-50 p-2.5 rounded-full">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-1 rounded-full">
                    FAQ - {item.id}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-gray-900 font-black text-xl leading-snug tracking-tight">
                  {item.q}
                </h3>

                {/* Divider */}
                <div className="h-px bg-gray-100" />

                {/* Answer */}
                <p className="text-gray-600 leading-relaxed text-sm font-medium">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Animation Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default FAQSection;





//backup code for the FAQS 
// import React, { useState, useEffect } from "react";  
// import { motion, AnimatePresence } from "framer-motion";

// const FAQSection = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [radius, setRadius] = useState(280); // ✅ responsive circle radius

//   // ✅ Update radius based on screen size
//   useEffect(() => {
//     const updateRadius = () => {
//       if (window.innerWidth < 480) setRadius(140); // small mobile
//       else if (window.innerWidth < 768) setRadius(180); // mobile
//       else if (window.innerWidth < 1024) setRadius(220); // tablet
//       else setRadius(320); // desktop
//     };
//     updateRadius();
//     window.addEventListener("resize", updateRadius);
//     return () => window.removeEventListener("resize", updateRadius);
//   }, []);

//   // ✅ FAQs
//   const faqData = [
//     {
//       id: 1,
//       question: "How does the AI interview system work?",
//       answer:
//         "Our advanced AI uses natural language processing and machine learning to conduct realistic interviews, analyzing your responses for content quality, delivery style, confidence levels, and providing instant feedback on areas for improvement.",
//     },
//     {
//       id: 2,
//       question: "Can I practice for specific companies?",
//       answer:
//         "Yes! We have customized interview prep for 500+ top companies including FAANG, consulting firms, startups, and Fortune 500 companies. Each program includes company-specific questions and cultural insights.",
//     },
//     {
//       id: 3,
//       question: "What kind of feedback do I receive?",
//       answer:
//         "You'll get detailed performance reports including communication analysis, content evaluation, confidence assessment, suggested improvements, and personalized coaching recommendations based on your specific goals.",
//     },
//     {
//       id: 4,
//       question: "Is there a money-back guarantee?",
//       answer:
//         "Absolutely! We offer a 30-day money-back guarantee if you're not completely satisfied with your experience. We're confident in our ability to help you succeed.",
//     },
//     {
//       id: 5,
//       question: "How much does it cost?",
//       answer:
//         "We offer flexible pricing plans starting from $29/month for basic access, with premium plans at $79/month including expert reviews, and enterprise solutions for organizations.",
//     },
//     {
//       id: 6,
//       question: "Do you offer group or corporate training?",
//       answer:
//         "Yes, we provide comprehensive corporate training programs for teams and organizations, including bulk licensing, custom content, and dedicated support from our enterprise team.",
//     },
//   ];

//   // ✅ Circular positions use responsive radius
//   const getCircularPosition = (index, total) => {
//     const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
//     const x = Math.cos(angle) * radius;
//     const y = Math.sin(angle) * radius;
//     return { x, y };
//   };

//   // Animation variants
//   const cardVariants = {
//     hidden: { opacity: 0, x: 0, y: 0, scale: 0.3, rotate: -180 },
//     visible: (custom) => {
//       const pos = getCircularPosition(custom.index, faqData.length);
//       return {
//         opacity: 1,
//         x: pos.x,
//         y: pos.y,
//         scale: 1,
//         rotate: 0,
//         transition: {
//           type: "spring",
//           duration: 1.0,
//           bounce: 0.4,
//           delay: custom.index * 0.15,
//         },
//       };
//     },
//     exit: (custom) => ({
//       opacity: 0,
//       x: 0,
//       y: 0,
//       scale: 0.3,
//       rotate: 180,
//       transition: {
//         duration: 0.6,
//         delay: (faqData.length - 1 - custom.index) * 0.1,
//       },
//     }),
//     hover: {
//       scale: 1.1,
//       rotate: 5,
//       transition: { type: "spring", duration: 0.3 },
//     },
//   };

//   const buttonVariants = {
//     idle: {
//       scale: 1,
//       boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
//       rotate: 0,
//     },
//     hover: {
//       scale: 1.05,
//       boxShadow: "0 8px 30px rgba(59, 130, 246, 0.4)",
//       rotate: 5,
//       transition: { duration: 0.2 },
//     },
//     tap: { scale: 0.98, rotate: -5 },
//   };

//   const toggleFAQs = () => setIsVisible(!isVisible);

//   return (
//     <div>
//       {/* Background Elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/3 rounded-full"></div>
//       </div>

//       {/* Main Content */}
//       <div className="relative z-10 w-full max-w-6xl mx-auto">
//         {/* Header Section */}
//         <div className="text-center mb-8">
//           <h1 className="text-5xl font-aquire font-bold text-black mb-4">
//             Frequently Asked Questions
//           </h1>
//           <p className="text-xl text-gray-700 max-w-2xl mx-auto">
//             Get instant answers to the most common questions about our platform
//           </p>
//         </div>

//         {/* Expand / Collapse Container */}
//         <motion.div
//           animate={{ height: isVisible ? radius * 2 + 300 : 0 }}
//           transition={{ duration: 0.8, ease: "easeInOut" }}
//           className="relative overflow-hidden"
//         >
//           {/* Circular FAQ Container */}
//           <div
//             className="relative flex items-center justify-center"
//             style={{ height: radius * 2 + 220 }}
//           >
//             <AnimatePresence mode="wait">
//               {isVisible &&
//                 faqData.map((faq, index) => (
//                   <motion.div
//                     key={faq.id}
//                     custom={{ index }}
//                     variants={cardVariants}
//                     initial="hidden"
//                     animate="visible"
//                     exit="exit"
//                     whileHover="hover"
//                     className="absolute group cursor-pointer"
//                     style={{ width: "260px", perspective: "1000px" }}
//                   >
//                     <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
//                       {/* Card Glow */}
//                       <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

//                       {/* Card Number */}
//                       <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
//                         {index + 1}
//                       </div>

//                       {/* Content */}
//                       <div className="relative z-10">
//                         <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
//                           {faq.question}
//                         </h3>
//                         <p className="text-gray-800 text-sm leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
//                           {faq.answer}
//                         </p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//             </AnimatePresence>
//           </div>
//         </motion.div>

//         {/* Central Toggle Button - Always Visible */}
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
//               <motion.button
//                 variants={buttonVariants}
//                 initial="idle"
//                 whileHover="hover"
//                 whileTap="tap"
//                 onClick={toggleFAQs}
//                 className=" px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-2xl backdrop-blur-sm border border-white/20 transition-all duration-300"
//               >
//                 <span className="flex items-center gap-3">
//                   <motion.div
//                     animate={{ rotate: isVisible ? 180 : 0 }}
//                     transition={{ duration: 0.3 }}
//                     className="text-lg"
//                   >
//                     ▼
//                   </motion.div>
//                   <span className="whitespace-nowrap">
//                     {isVisible ? "Hide FAQs" : "Show FAQs"}
//                   </span>
//                 </span>
//               </motion.button>
//             </div>

//         {/* Footer Text */}
//         <AnimatePresence>
//           {isVisible && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ delay: 1.0 }}
//               className="text-center mt-8"
//             >
//               <p className="text-gray-600">
//                 Still have questions?
//                 <span className="text-blue-600 hover:text-blue-500 cursor-pointer ml-2 transition-colors">
                    
//                   Contact our support team →
                  
//                 </span>
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// };

// export default FAQSection;