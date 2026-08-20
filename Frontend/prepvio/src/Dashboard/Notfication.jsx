import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import {
  Bell,
  Check,
  X,
  Trash2,
  CheckCheck,
  Info,
  AlertTriangle,
  PartyPopper,
  Zap,
  Mail
} from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import socket from "../socket";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2 } }
};

// --- HELPER: GET ICON & COLOR BASED ON TYPE ---
const getNotificationStyle = (type) => {
  switch (type) {
    case "success":
      return {
        icon: PartyPopper,
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-500"
      };
    case "warning":
      return {
        icon: AlertTriangle,
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-500"
      };
    case "error":
      return {
        icon: Zap,
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-500"
      };
    default: // info or system
      return {
        icon: Mail,
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-500"
      };
  }
};

function Notifications() {
  // ✅ USE ZUSTAND STORE INSTEAD OF LOCAL STATE
  const { addNotification } = useNotificationStore();
  const { setMobileOpen } = useOutletContext();

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  // ✅ FETCH ALL NOTIFICATIONS WHEN COMPONENT MOUNTS
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    fetchUnreadCount(); // Refresh unread count immediately
    socket.emit("NOTIFICATION_READ"); // Notify other components
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchUnreadCount(); // Refresh unread count immediately
    socket.emit("NOTIFICATION_READ"); // Notify other components
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    fetchUnreadCount(); // Refresh unread count immediately
    socket.emit("NOTIFICATION_DELETED"); // Notify other components
  };

  const handleClearAll = async () => {
    // Delete all notifications one by one
    for (const notif of notifications) {
      await deleteNotification(notif._id);
    }
    fetchUnreadCount(); // Refresh unread count immediately
    socket.emit("NOTIFICATION_DELETED"); // Notify other components
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black">
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Notifications
              {/* ✅ SIMPLE DOT INDICATOR */}
              {unreadCount > 0 && (
                <span className="w-3 h-3 bg-[#D4F478] rounded-full shadow-sm animate-pulse" />
              )}
            </h1>
            <p className="text-gray-500 font-medium mt-1">Stay updated with your latest alerts.</p>
          </div>

          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-[2.5rem] p-2 md:p-6 shadow-sm border border-gray-100 min-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500 mt-1">You have no new notifications at the moment.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {notifications.map((notif) => {
                  const style = getNotificationStyle(notif.type);
                  const Icon = style.icon;

                  return (
                    <motion.div
                      key={notif._id}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`
                        group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200
                        ${!notif.isRead
                          ? "bg-white border-l-4 border-l-[#1A1A1A] border-y-gray-100 border-r-gray-100 shadow-md"
                          : "bg-gray-50/50 border-transparent hover:bg-white hover:shadow-sm"
                        }
                      `}
                    >
                      {/* Icon Box */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-base font-bold truncate ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notif.title || (notif.type ? notif.type.charAt(0).toUpperCase() + notif.type.slice(1) : 'Notification')}
                          </h4>
                          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notif.message}
                        </p>
                      </div>

                      {/* Actions (Hover to show on Desktop, Always visible logic can be added for mobile if needed) */}
                      <div className="flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#D4F478] hover:text-black transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unread Dot Indicator */}
                      {!notif.isRead && (
                        <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-indigo-500 md:hidden" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Notifications;