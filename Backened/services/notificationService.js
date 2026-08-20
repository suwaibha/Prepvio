import Notification from "../Models/Notification.js";
import { io } from "../server.js";

 const sendManualNotification = async (userId, message) => {
  const notification = await Notification.create({
    userId,
    type: "system",
    message,
  });

  io.to(userId.toString()).emit("NEW_NOTIFICATION", notification);
};

export default sendManualNotification;