import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./Models/User.js";

dotenv.config();

const verifyAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const admins = await User.find({ role: "admin" }).select("name email userId role");
        console.log("Found Admins:", admins);
        console.log(`Total Admins Count: ${admins.length}`);

    } catch (error) {
        console.error("❌ Error verifying admins:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

verifyAdmins();