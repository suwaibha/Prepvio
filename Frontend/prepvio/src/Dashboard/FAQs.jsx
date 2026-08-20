import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  ChevronDown, 
  Search, 
  X, 
  Phone, 
  Mail, 
  MessageCircle, 
  Plus, 
  Minus, 
  LifeBuoy
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";

// --- DATA ---
const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        id: 1,
        question: "How do I create an account on Prepvio?",
        answer: "To create an account, click on the 'Sign Up' button on the homepage. Fill in your details including name, email, and password. Verify your email address through the link sent to your inbox, and you're all set to start learning, bhidu!"
      },
      {
        id: 2,
        question: "How do I enroll in a course?",
        answer: "Browse through our course catalog, select the course you're interested in, and click on 'Enroll Now'. You can access the course immediately from your Learning dashboard."
      },
      {
        id: 3,
        question: "Is there a mobile app available?",
        answer: "Yes! Prepvio is available on both iOS and Android. Download our app from the App Store or Google Play Store to learn on the go."
      }
    ]
  },
  {
    category: "Courses & Learning",
    questions: [
      {
        id: 4,
        question: "How long do I have access to a course?",
        answer: "Once you enroll in a course, you have lifetime access to all course materials. You can learn at your own pace and revisit the content anytime."
      },
      {
        id: 5,
        question: "Can I download course videos?",
        answer: "Yes, premium members can download course videos for offline viewing through our mobile app. This feature is available for all enrolled courses."
      }
    ]
  },
  {
    category: "Payment & Subscription",
    questions: [
      {
        id: 8,
        question: "What payment methods do you accept?",
        answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are processed securely through our payment gateway."
      },
      {
        id: 9,
        question: "Can I get a refund?",
        answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with a course, request a refund within 7 days of purchase from your Account settings."
      }
    ]
  }
];

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const { setMobileOpen } = useOutletContext();

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const totalFAQs = faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black">
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />
      
      {/* Centered Container - Width restricted for readability */}
      <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 pb-10 p-4 md:p-8">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4 md:space-y-6 pt-4 md:pt-10">
           <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold border border-indigo-100 shadow-sm">
              <HelpCircle className="w-3 h-3 md:w-4 md:h-4" /> Help Center
           </div>
           
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
             How can we help?
           </h1>
           
           {/* Search Bar */}
           <div className="relative max-w-lg mx-auto w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-[1.5rem] pl-12 pr-4 py-3 md:py-4 shadow-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm md:text-base font-medium"
              />
           </div>
        </div>

        {/* FAQs List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 md:space-y-10"
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-200">
               <p className="text-gray-500 font-medium">No results found for "{searchTerm}"</p>
               <button 
                 onClick={() => setSearchTerm('')}
                 className="text-indigo-600 font-bold text-sm mt-2 hover:underline"
               >
                 Clear Search
               </button>
            </div>
          ) : (
            filteredFAQs.map((category, catIndex) => (
              <motion.div key={catIndex} variants={itemVariants} className="space-y-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 px-2">{category.category}</h3>
                
                <div className="space-y-3">
                  {category.questions.map((faq) => (
                    <div 
                      key={faq.id} 
                      className={`
                        bg-white border transition-all duration-300 rounded-2xl overflow-hidden
                        ${openFAQ === faq.id ? 'border-gray-300 shadow-md ring-1 ring-black/5' : 'border-gray-100 hover:border-gray-200'}
                      `}
                    >
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full flex items-start md:items-center justify-between p-4 md:p-5 text-left gap-4"
                      >
                        <span className="text-sm md:text-base font-bold text-gray-900 pt-0.5 md:pt-0">
                          {faq.question}
                        </span>
                        <div className={`p-1 rounded-full flex-shrink-0 transition-colors ${openFAQ === faq.id ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                           {openFAQ === faq.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {openFAQ === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-4 md:px-5 pb-5 pt-0 text-gray-600 leading-relaxed text-sm">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Support Footer Card */}
        <div className="bg-[#1A1A1A] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-center text-white relative overflow-hidden shadow-2xl">
           {/* Background Blobs */}
           <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-[#D4F478]/10 rounded-full blur-[60px]" />
           
           <div className="relative z-10 space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-3xl font-black">Still have questions?</h2>
              <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
                Can't find the answer you're looking for? Please chat to our friendly team.
              </p>
              <button
                onClick={() => setShowContactPopup(true)}
                className="bg-[#D4F478] text-black px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm md:text-base font-bold hover:bg-white transition-colors shadow-lg hover:shadow-[#D4F478]/20"
              >
                Get in Touch
              </button>
           </div>
        </div>

      </div>

      {/* --- CONTACT POPUP --- */}
      <AnimatePresence>
        {showContactPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactPopup(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowContactPopup(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 md:mb-8 mt-2">
                 <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <LifeBuoy className="w-6 h-6 md:w-8 md:h-8" />
                 </div>
                 <h2 className="text-xl md:text-2xl font-black text-gray-900">We're here to help</h2>
                 <p className="text-gray-500 text-xs md:text-sm mt-2 font-medium">Our team is available 24/7 to assist you.</p>
              </div>

              <div className="space-y-3">
                 <a href="mailto:support@prepvio.com" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group bg-white">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                       <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">Email Support</p>
                       <p className="text-gray-900 font-bold text-sm md:text-base truncate">support@prepvio.com</p>
                    </div>
                 </a>

                 <a href="tel:1800-123-4567" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group bg-white">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0">
                       <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">Phone Support</p>
                       <p className="text-gray-900 font-bold text-sm md:text-base">1800-123-4567</p>
                    </div>
                 </a>
              </div>

              <div className="mt-6 md:mt-8 pt-6 border-t border-gray-100 text-center">
                 <p className="text-xs md:text-sm text-gray-500 italic">"Jo bhi doubt hai, hum hai na! 🚀"</p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default FAQs;





//Backup code hai yeah
// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   HelpCircle, 
//   ChevronDown, 
//   Search, 
//   X, 
//   Phone, 
//   Mail, 
//   MessageCircle,
//   Plus,
//   Minus,
//   LifeBuoy
// } from "lucide-react";

// // --- DATA ---
// const faqCategories = [
//   {
//     category: "Getting Started",
//     questions: [
//       {
//         id: 1,
//         question: "How do I create an account on Prepvio?",
//         answer: "To create an account, click on the 'Sign Up' button on the homepage. Fill in your details including name, email, and password. Verify your email address through the link sent to your inbox, and you're all set to start learning, bhidu!"
//       },
//       {
//         id: 2,
//         question: "How do I enroll in a course?",
//         answer: "Browse through our course catalog, select the course you're interested in, and click on 'Enroll Now'. You can access the course immediately from your Learning dashboard."
//       },
//       {
//         id: 3,
//         question: "Is there a mobile app available?",
//         answer: "Yes! Prepvio is available on both iOS and Android. Download our app from the App Store or Google Play Store to learn on the go."
//       }
//     ]
//   },
//   {
//     category: "Courses & Learning",
//     questions: [
//       {
//         id: 4,
//         question: "How long do I have access to a course?",
//         answer: "Once you enroll in a course, you have lifetime access to all course materials. You can learn at your own pace and revisit the content anytime."
//       },
//       {
//         id: 5,
//         question: "Can I download course videos?",
//         answer: "Yes, premium members can download course videos for offline viewing through our mobile app. This feature is available for all enrolled courses."
//       }
//     ]
//   },
//   {
//     category: "Payment & Subscription",
//     questions: [
//       {
//         id: 8,
//         question: "What payment methods do you accept?",
//         answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are processed securely through our payment gateway."
//       },
//       {
//         id: 9,
//         question: "Can I get a refund?",
//         answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with a course, request a refund within 7 days of purchase from your Account settings."
//       }
//     ]
//   }
// ];

// // --- ANIMATION VARIANTS ---
// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 10 },
//   visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
// };

// function FAQs() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [openFAQ, setOpenFAQ] = useState(null);
//   const [showContactPopup, setShowContactPopup] = useState(false);

//   const toggleFAQ = (id) => {
//     setOpenFAQ(openFAQ === id ? null : id);
//   };

//   const filteredFAQs = faqCategories.map(category => ({
//     ...category,
//     questions: category.questions.filter(
//       faq =>
//         faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//   })).filter(category => category.questions.length > 0);

//   const totalFAQs = faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0);

//   return (
//     <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black p-4 md:p-8">
      
//       <div className="max-w-[1000px] mx-auto space-y-10">
        
//         {/* Header Section */}
//         <div className="text-center max-w-2xl mx-auto space-y-6">
//            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100">
//               <HelpCircle className="w-4 h-4" /> Help Center
//            </div>
//            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
//              How can we help?
//            </h1>
           
//            {/* Search Bar */}
//            <div className="relative max-w-lg mx-auto">
//               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search for answers..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full bg-white border border-gray-200 rounded-[1.5rem] pl-12 pr-4 py-4 shadow-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
//               />
//            </div>
//         </div>

//         {/* FAQs List */}
//         <motion.div 
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//           className="space-y-8"
//         >
//           {filteredFAQs.length === 0 ? (
//             <div className="text-center py-12">
//                <p className="text-gray-500 font-medium">No results found for "{searchTerm}"</p>
//             </div>
//           ) : (
//             filteredFAQs.map((category, catIndex) => (
//               <motion.div key={catIndex} variants={itemVariants} className="space-y-4">
//                 <h3 className="text-xl font-bold text-gray-900 px-2">{category.category}</h3>
                
//                 <div className="space-y-3">
//                   {category.questions.map((faq) => (
//                     <div 
//                       key={faq.id} 
//                       className={`
//                         bg-white border transition-all duration-300 rounded-2xl overflow-hidden
//                         ${openFAQ === faq.id ? 'border-gray-300 shadow-md' : 'border-gray-100 hover:border-gray-200'}
//                       `}
//                     >
//                       <button
//                         onClick={() => toggleFAQ(faq.id)}
//                         className="w-full flex items-center justify-between p-5 text-left"
//                       >
//                         <span className="text-base font-bold text-gray-900 pr-8">
//                           {faq.question}
//                         </span>
//                         <div className={`p-1 rounded-full transition-colors ${openFAQ === faq.id ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-500'}`}>
//                            {openFAQ === faq.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
//                         </div>
//                       </button>
                      
//                       <AnimatePresence>
//                         {openFAQ === faq.id && (
//                           <motion.div
//                             initial={{ height: 0, opacity: 0 }}
//                             animate={{ height: "auto", opacity: 1 }}
//                             exit={{ height: 0, opacity: 0 }}
//                             transition={{ duration: 0.3, ease: "easeInOut" }}
//                           >
//                             <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed text-sm">
//                               {faq.answer}
//                             </div>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             ))
//           )}
//         </motion.div>

//         {/* Support Footer */}
//         <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 md:p-12 text-center text-white relative overflow-hidden">
//            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4F478]/10 rounded-full blur-[80px]" />
           
//            <div className="relative z-10 space-y-6">
//               <h2 className="text-2xl md:text-3xl font-black">Still have questions?</h2>
//               <p className="text-gray-400 max-w-md mx-auto">
//                 Can't find the answer you're looking for? Please chat to our friendly team.
//               </p>
//               <button
//                 onClick={() => setShowContactPopup(true)}
//                 className="bg-[#D4F478] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-white transition-colors"
//               >
//                 Get in Touch
//               </button>
//            </div>
//         </div>

//       </div>

//       {/* --- CONTACT POPUP --- */}
//       <AnimatePresence>
//         {showContactPopup && (
//           <motion.div 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//             onClick={() => setShowContactPopup(false)}
//           >
//             <motion.div 
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <button 
//                 onClick={() => setShowContactPopup(false)}
//                 className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>

//               <div className="text-center mb-8">
//                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <LifeBuoy className="w-8 h-8" />
//                  </div>
//                  <h2 className="text-2xl font-black text-gray-900">We're here to help</h2>
//                  <p className="text-gray-500 text-sm mt-2">Our team is available 24/7 to assist you.</p>
//               </div>

//               <div className="space-y-4">
//                  <a href="mailto:support@prepvio.com" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group">
//                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
//                        <Mail className="w-5 h-5" />
//                     </div>
//                     <div>
//                        <p className="text-xs font-bold text-gray-400 uppercase">Email Support</p>
//                        <p className="text-gray-900 font-bold">support@prepvio.com</p>
//                     </div>
//                  </a>

//                  <a href="tel:1800-123-4567" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group">
//                     <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
//                        <Phone className="w-5 h-5" />
//                     </div>
//                     <div>
//                        <p className="text-xs font-bold text-gray-400 uppercase">Phone Support</p>
//                        <p className="text-gray-900 font-bold">1800-123-4567</p>
//                     </div>
//                  </a>
//               </div>

//               <div className="mt-8 pt-6 border-t border-gray-100 text-center">
//                  <p className="text-sm text-gray-500 italic">"Jo bhi doubt hai, hum hai na! 🚀"</p>
//               </div>

//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }

// export default FAQs;