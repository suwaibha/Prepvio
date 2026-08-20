import mongoose from "mongoose";
import dotenv from "dotenv";
import Notification from "./Backened/Models/Notification.js";

dotenv.config({ path: "./Backened/.env" });

async function checkNotifications() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const recent = await Notification.find().sort({ createdAt: -1 }).limit(5);
        console.log("Recent notifications in DB:");
        console.log(JSON.stringify(recent, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkNotifications();
