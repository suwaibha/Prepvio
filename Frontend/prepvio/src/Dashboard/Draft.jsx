import React from "react";
import { MessageCircle } from "lucide-react";

function Draft() {
  const draftMessages = [
    {
      id: 1,
      text: "Tu real hai ya AI",
      date: "01-05-2025",
      time: "10:00 AM",
      status: "Not sent",
      statusColor: "bg-red-500",
    },
    {
      id: 2,
      text: "Bhai padhai ka mann nahi lag raha aaj... kuch motivation de",
      date: "05-05-2025",
      time: "11:51 AM",
      status: "Not sent",
      statusColor: "bg-red-500",
    },
    {
      id: 3,
      text: "Bro mera code chal hi nahi raha, dekh zara kya bug hai?",
      date: "06-05-2025",
      time: "10:55 PM",
      status: "Not sent",
      statusColor: "bg-red-500",
    },
  ];

  return (
    <div className="flex h-screen overflow-x-hidden p-6">
      <div className="flex-1">
        {/* Main Glassy Container */}
        <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-lg flex flex-col min-h-screen p-6 transition-all duration-300">
          
          {/* Header */}
          <div className="pb-4 border-b border-white/50 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
              Draft
            </h2>
          </div>

          {/* Draft Messages List */}
          <div className="flex flex-col space-y-4">
            {draftMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-md self-end max-w-[80%] transition-all duration-300"
              >
                <p className="text-sm font-medium text-gray-800">You</p>
                <p className="text-base text-gray-800">{msg.text}<br />Date: {msg.date}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">{msg.time}</p>
                <span className={`${msg.statusColor} text-white px-2 py-1 rounded mt-2 inline-block text-xs`}>
                  {msg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Draft;
