import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Paperclip, 
  Smile, 
  Send, 
  MessageCircle, 
  Search, 
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { mainApi } from "../utils/apiClient";
import { useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import socket from "../socket";

// --- ANIMATION VARIANTS ---
const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 150, damping: 20 } 
  }
};

function Message() {
  const [newMessages, setNewMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessageText, setNewMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const { setMobileOpen } = useOutletContext();

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await mainApi.get("/chat/messages");
        if (res.data.success) {
          setNewMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Socket listener for new messages
  useEffect(() => {
    // Import helper if needed, but socket.js handles most of it
    // For now, let's assume connectSocket is needed to pass credentials/auth
    import("../socket").then(({ connectSocket }) => {
      connectSocket();
    });

    socket.on("new_message", (message) => {
      setNewMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.off("new_message");
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newMessages]);

  const handleSendMessage = async () => {
    if (newMessageText.trim()) {
      const text = newMessageText.trim();
      setNewMessageText(""); // Clear immediately for UX

      try {
        const res = await mainApi.post("/chat/send", { text });
        if (res.data.success) {
          // If we want to avoid double-adding if socket emits to sender too:
          // But usually we add manually for instant feedback and check ID
          setNewMessages((prev) => {
            if (prev.find(m => m.id === res.data.message.id)) return prev;
            return [...prev, res.data.message];
          });
        }
      } catch (err) {
        console.error("Failed to send message", err);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black flex flex-col h-screen overflow-hidden">
      
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      {/* Container - added padding and adjusted for mobile header */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative p-4 md:p-6 lg:p-8">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-4 md:px-8 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
           <div className="flex items-center gap-4">
              <div className="relative">
                 <div className="w-12 h-12 bg-[#D4F478] rounded-full flex items-center justify-center text-black font-bold text-xl border-2 border-white shadow-sm">
                    P
                 </div>
                 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                 <h2 className="text-xl font-black text-gray-900 leading-tight">Prepvio Support</h2>
                 <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                 </p>
              </div>
           </div>

           {/* Header Actions (Hidden on very small screens) */}
           <div className="flex items-center gap-1 md:gap-2">
              <button className="p-3 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors hidden sm:block">
                 <Search className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors hidden sm:block">
                 <Phone className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors">
                 <MoreVertical className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* --- MESSAGES LIST --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#FDFBF9]/50">
           <AnimatePresence initial={false}>
             {newMessages.map((msg) => {
               const isMe = msg.sender === "CurrentUser";
               return (
                 <motion.div
                   key={msg.id}
                   variants={messageVariants}
                   initial="hidden"
                   animate="visible"
                   className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4`}
                 >
                   <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border border-gray-100 ${isMe ? "bg-gray-200 text-gray-600" : "bg-[#D4F478] text-black"}`}>
                         {isMe ? "U" : "P"}
                      </div>

                      {/* Message Bubble */}
                      <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                         isMe 
                           ? "bg-[#1A1A1A] text-white rounded-br-none" 
                           : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                      }`}>
                         <p>{msg.text}</p>
                         <span className={`text-[10px] font-bold mt-1.5 block opacity-60 ${isMe ? "text-right" : "text-left"}`}>
                            {msg.timestamp}
                         </span>
                      </div>

                   </div>
                 </motion.div>
               );
             })}
           </AnimatePresence>
           <div ref={messagesEndRef} />
        </div>

        {/* --- INPUT AREA --- */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 relative z-20">
           <div className="flex items-end gap-2 md:gap-3 bg-gray-50 rounded-[1.5rem] p-2 border border-gray-200 focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-100 transition-all shadow-inner">
              
              <button className="p-3 text-gray-400 hover:text-black hover:bg-white rounded-full transition-all flex-shrink-0">
                 <Paperclip className="w-5 h-5" />
              </button>

              <textarea
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 py-3 min-h-[44px] max-h-32 resize-none font-medium leading-relaxed custom-scrollbar"
                rows={1}
              />

              <div className="flex items-center gap-1 pb-1">
                 <button className="p-3 text-gray-400 hover:text-black hover:bg-white rounded-full transition-all hidden sm:block">
                    <Smile className="w-5 h-5" />
                 </button>
                 
                 <button
                   onClick={handleSendMessage}
                   disabled={!newMessageText.trim()}
                   className="bg-[#1A1A1A] text-white p-3 rounded-xl hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                 >
                    <Send className="w-5 h-5 ml-0.5" />
                 </button>
              </div>
           </div>
           
           <p className="text-center text-xs font-bold text-gray-300 mt-3">
              Press Enter to send
           </p>
        </div>

      </div>
    </div>
  );
}

export default Message;




//Backup code hai yeah
// import React, { useState } from "react";
// import { Paperclip, Smile, Send, MessageCircle } from "lucide-react";

// function Message() {
//   const [newMessages, setNewMessages] = useState([]);
//   const [newMessageText, setNewMessageText] = useState("");

//   const handleSendMessage = () => {
//     if (newMessageText.trim()) {
//       const sender = "CurrentUser";
//       const timestamp = new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//       const message = {
//         id: newMessages.length + 101,
//         sender,
//         text: newMessageText,
//         timestamp,
//       };
//       setNewMessages([...newMessages, message]);
//       setNewMessageText("");
//     }
//   };

//   return (
//     <div className="flex h-screen  overflow-x-hidden p-6">
//       <div className="flex-1">
//         {/* Main Glassy Container */}
//         <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-lg flex flex-col h-full transition-all duration-300">
          
//           {/* Header */}
//           <div className="p-6 border-b border-white/50">
//             <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
//               <MessageCircle className="w-6 h-6 text-indigo-600" />
//               Messages
//             </h2>
//           </div>

//           {/* Messages List */}
//           <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
//             {/* Example static messages */}
//             <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm text-gray-800 self-start max-w-[80%] shadow-md">
//               <p className="text-sm font-medium">Prepvio</p>
//               <p className="text-base">
//                 Welcome to Prepvio Bhidu, Chal aja baat chit karte hai sab thik!
//               </p>
//               <p className="text-xs text-gray-500 mt-1 text-right">10:00 AM</p>
//             </div>

//             <div className="p-3 rounded-2xl bg-indigo-100/50 backdrop-blur-sm text-gray-800 self-end max-w-[80%] shadow-md">
//               <p className="text-sm font-medium">You</p>
//               <p className="text-base">
//                 Hi! I have a question about my recent subscription plan.
//               </p>
//               <p className="text-xs text-gray-500 mt-1 text-right">10:05 AM</p>
//             </div>

//             {/* Dynamic Messages */}
//             {newMessages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`p-3 rounded-2xl backdrop-blur-sm shadow-md max-w-[80%] ${
//                   msg.sender === "CurrentUser"
//                     ? "bg-indigo-100/50 self-end text-gray-800 ml-auto"
//                     : "bg-white/50 self-start text-gray-800 mr-auto"
//                 }`}
//               >
//                 <p className="text-sm font-medium">
//                   {msg.sender === "CurrentUser" ? "You" : msg.sender}
//                 </p>
//                 <p className="text-base">{msg.text}</p>
//                 <p className="text-xs text-gray-500 mt-1 text-right">
//                   {msg.timestamp}
//                 </p>
//               </div>
//             ))}
//           </div>

//           {/* Input Area */}
//           <div className="p-4 border-t border-white/50 bg-white/30 backdrop-blur-2xl rounded-b-3xl flex items-center gap-2 shadow-inner">
//             <textarea
//               placeholder="Type kar bhidu..."
//               value={newMessageText}
//               onChange={(e) => setNewMessageText(e.target.value)}
//               className="flex-1 bg-white/50 backdrop-blur-sm border border-white/50 text-gray-800 min-h-[2.5rem] resize-none rounded-2xl p-3 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 transition-all duration-300"
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSendMessage();
//                 }
//               }}
//             />
//             <button
//               type="button"
//               className="text-gray-500 p-2 rounded-full hover:bg-white/20 transition"
//               title="Attach File"
//             >
//               <Paperclip className="w-6 h-6" />
//             </button>
//             <button
//               type="button"
//               className="text-gray-500 p-2 rounded-full hover:bg-white/20 transition"
//               title="Add Emoji"
//             >
//               <Smile className="w-6 h-6" />
//             </button>
//             <button
//               onClick={handleSendMessage}
//               className="bg-indigo-500 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
//               disabled={!newMessageText.trim()}
//             >
//               <Send className="w-4 h-4" /> Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Message;