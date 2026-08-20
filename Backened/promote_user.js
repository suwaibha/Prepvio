import dotenv from "dotenv";
dotenv.config();
import bcryptjs from "bcryptjs";

import mongoose from "mongoose";
import { User } from "./Models/User.js";

const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error("Please provide an email address: node promote_user.js <email>");
    process.exit(1);
}

async function promoteUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.error(`❌ User not found with email: ${targetEmail}`);

            // Optional: Create if not exists? No, safer to fail.
            // Or prompt to create?
            console.log("Creating new admin user...");
            const hashedPassword = await bcryptjs.hash("password123", 10);

            const newUser = new User({
                name: "Admin User",
                email: targetEmail,
                password: hashedPassword, // Default password
                role: "admin",
                isVerified: true
            });
            await newUser.save();
            console.log(`✅ Created NEW Admin user: ${targetEmail}`);
            console.log(`🔑 Password: password123`);
        } else {
            user.role = "admin";
            // Also fix the password if it was broken
            user.password = await bcryptjs.hash("password123", 10);
            await user.save();
            console.log(`✅ User ${targetEmail} promoted to ADMIN and password reset to 'password123'!`);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

promoteUser();