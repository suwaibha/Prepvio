import express from "express";
import Notification from "../Models/Notification.js";
import { verifyToken } from "../middleware/verifytoken.js";
import { io } from "../server.js";
import { deduplicateNotifications } from "../Utils/notificationHelper.js";

const router = express.Router();

/**
 * GET recent notifications (for bell icon - last 2)
 * /api/notifications/recent
 * ⚠️ MUST BE BEFORE THE "/" ROUTE
 */
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10); // Fetch more to allow for deduplication

    res.json(deduplicateNotifications(notifications).slice(0, 2));
  } catch (error) {
    console.error("Error fetching recent notifications:", error);
    res.status(500).json({ message: "Error fetching recent notifications" });
  }
});

/**
 * GET all notifications for authenticated user (for dashboard)
 * /api/notifications
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100); // Fetch more to allow for deduplication

    res.json(deduplicateNotifications(notifications).slice(0, 50));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

/**
 * GET unread count for authenticated user
 * /api/notifications/unread-count
 */
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const unreadNotifications = await Notification.find({
      userId: req.userId,
      isRead: false,
    });

    const deduplicated = deduplicateNotifications(unreadNotifications);
    res.json({ count: deduplicated.length });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Error fetching unread count" });
  }
});

/**
 * POST - Send a notification
 * /api/notifications/send
 * Body: { userId, title, message, type? }
 */
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and message are required"
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "system",
      isRead: false,
    });

    io.to(userId.toString()).emit("NEW_NOTIFICATION", notification);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Error sending notification"
    });
  }
});

/**
 * MARK AS READ
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification"
    });
  }
});

/**
 * MARK ALL AS READ
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications"
    });
  }
});

/**
 * DELETE a notification
 * DELETE /api/notifications/:id
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification"
    });
  }
});

export default router;