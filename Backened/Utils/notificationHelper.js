import Notification from "../Models/Notification.js";
import { io } from "../server.js";

/**
 * Create and send a notification to a user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (welcome, course_started, course_completed, interview_completed, achievement)
 * @param {object} metadata - Additional data to store with notification
 */
export const sendNotification = async (userId, title, message, type = "general", metadata = {}) => {
  try {
    console.log(`[DEBUG] Attempting to send notification to ${userId}: ${title}`);

    // ✅ PREVENT RAPID-FIRE DUPLICATES: Check for existing recent notifications with same content
    // EXCEPT for ticket replies, as multiple replies to the same ticket are valid.
    if (type !== "system") {
      const existing = await Notification.findOne({
        userId,
        title,
        message,
        type,
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
      });

      if (existing) {
        console.log(`[DEBUG] Blocked duplicate notification: ${title}`);
        return existing;
      }
    }

    // Create notification in database
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
      metadata,
    });

    await notification.save();
    console.log(`[DEBUG] Notification saved to DB: ${notification._id}`);

    // Emit socket event to send real-time notification
    // Use dynamic import to avoid circular dependency issues at the top level
    const { io } = await import("../server.js");

    if (io) {
      // ✅ USE CORRECT ROOM NAME (toString)
      io.to(userId.toString()).emit("NEW_NOTIFICATION", notification);
      console.log(`[DEBUG] Socket emission sent to user room: ${userId}`);
    } else {
      console.warn("[DEBUG] Socket.io instance not available in notificationHelper");
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

/**
 * Deduplicates a list of notifications based on type and metadata/content.
 * This is useful for cleaning up existing duplicates on the fly.
 */
export const deduplicateNotifications = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) return [];

  const seen = new Set();
  return notifications.filter(n => {
    // Generate a key for deduplication
    // We use type, message, and bits of metadata if available
    const metadataKey = n.metadata ? JSON.stringify(n.metadata) : '';
    const key = `${n.type}-${n.title}-${n.message}-${metadataKey}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const sendWelcomeNotification = async (userId, userName) => {
  const firstName = userName?.split(" ")[0] || "there";
  return sendNotification(
    userId,
    `🎉 Welcome Aboard, ${firstName}!`,
    `Your journey to success starts now! 🚀 Explore AI-powered mock interviews, master technical skills with expert courses, and unlock your full potential. We're here to help you land your dream job! 💼✨`,
    "welcome",
    { action: "welcome", userName }
  );
};

/**
 * Free interview credit notification for new users
 */
export const sendFreeInterviewCreditNotification = async (userId, userName) => {
  const firstName = userName?.split(" ")[0] || "there";
  return sendNotification(
    userId,
    `🎁 Free Interview Credit, ${firstName}!`,
    `Great news! You've been credited with 1 FREE interview with full features. 🌟 Practice with our AI interviewer, get detailed feedback, and boost your confidence. Start your first interview now! 🚀`,
    "credit",
    { action: "free_interview_credit", creditAmount: 1 }
  );
};

/**
 * Credits exhausted notification
 */
export const sendCreditsExhaustedNotification = async (userId, userName) => {
  const firstName = userName?.split(" ")[0] || "there";
  return sendNotification(
    userId,
    `⚠️ Interview Credits Used, ${firstName}`,
    `You've used all your interview credits. 💳 Upgrade your plan to unlock more AI-powered mock interviews and continue your preparation journey! 🚀`,
    "warning",
    { action: "credits_exhausted", requiresUpgrade: true }
  );
};

/**
 * Course started notification
 */
export const sendCourseStartedNotification = async (userId, courseTitle, channelName) => {
  return sendNotification(
    userId,
    "📚 Course Started",
    `You've started "${courseTitle}" from ${channelName}. Keep going, you're doing great!`,
    "course_started",
    { action: "course_started", courseTitle, channelName }
  );
};

/**
 * Course completed notification
 */
export const sendCourseCompletedNotification = async (userId, courseTitle, channelName) => {
  return sendNotification(
    userId,
    "🏆 Course Completed!",
    `Congratulations! You've completed "${courseTitle}" from ${channelName}. On to the next one!`,
    "course_completed",
    { action: "course_completed", courseTitle, channelName }
  );
};

/**
 * Interview completed notification
 */
export const sendInterviewCompletedNotification = async (userId, role, score) => {
  return sendNotification(
    userId,
    "🎤 Interview Completed!",
    `Great job! You completed the ${role} interview. Check your detailed report to improve further.`,
    "interview_completed",
    { action: "interview_completed", role, score }
  );
};

/**
 * Achievement unlocked notification
 */
export const sendAchievementNotification = async (userId, achievementTitle, achievementDescription) => {
  return sendNotification(
    userId,
    `🌟 ${achievementTitle}`,
    achievementDescription,
    "achievement",
    { action: "achievement", title: achievementTitle }
  );
};

/**
 * Support ticket reply notification
 */
export const sendTicketReplyNotification = async (userId, ticketId) => {
  return sendNotification(
    userId,
    "🎫 Support Ticket Update",
    `There is a new reply for your ticket ${ticketId || ""}. Check it out in the Support section.`,
    "system",
    { action: "ticket_reply", ticketId }
  );
};
