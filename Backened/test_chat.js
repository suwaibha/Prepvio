import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import axios from "axios";
import { User } from "./Models/User.js";

const BASE_URL = "http://localhost:5000/api";

// Helper for immediate logging
const log = (msg) => {
    process.stdout.write(msg + '\n');
};

async function runTest() {
    log("🚀 Starting Helpdesk Chat System automated test...");

    // 1. Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log("✅ Connected to MongoDB");
    } catch (error) {
        log(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }

    try {
        // --- STEP 1: Create a Normal User ---
        const userEmail = `testuser_${Date.now()}@example.com`;
        const userPassword = "password123";
        log(`\n👤 Creating User: ${userEmail}`);

        const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
            name: "Test User",
            email: userEmail,
            password: userPassword
        });
        log(`Sign Up Status: ${signupRes.status}`);

        // Get verification token from DB
        log("Searching DB for user...");
        const userDoc = await User.findOne({ email: userEmail });
        if (!userDoc) throw new Error("User not found in DB");
        log(`Found user: ${userDoc._id}, Token: ${userDoc.verificationToken}`);

        // Verify Email
        log("Verifying email...");
        const verifyRes = await axios.post(`${BASE_URL}/auth/verify-email`, {
            code: userDoc.verificationToken
        });
        log("Email verified.");

        // Get User Token Cookie
        const cookies = verifyRes.headers['set-cookie'];
        if (!cookies) throw new Error("No cookies returned from verify-email");
        const userCookie = cookies[0].split(';')[0];
        log(`User Cookie obtained: ${userCookie.substring(0, 20)}...`);

        // --- STEP 2: User Sends Message ---
        log("\n📨 User sending message to Admin...");
        await axios.post(`${BASE_URL}/chat/send`, {
            text: "Hello I need help!"
        }, {
            headers: { Cookie: userCookie }
        });
        log("✅ Message sent successfully");

        // --- STEP 3: Create an Admin User ---
        const adminEmail = `admin_${Date.now()}@example.com`;
        log(`\n👮 Creating Admin: ${adminEmail}`);

        await axios.post(`${BASE_URL}/auth/signup`, {
            name: "Admin User",
            email: adminEmail,
            password: userPassword
        });

        // Manually make admin in DB
        const adminDoc = await User.findOne({ email: adminEmail });
        adminDoc.isVerified = true;
        adminDoc.verificationToken = undefined;
        adminDoc.role = "admin"; // Set role to admin
        await adminDoc.save();
        log("Admin role assigned in DB.");

        // Login as Admin
        log("Logging in as Admin...");
        const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: adminEmail,
            password: userPassword
        });
        const adminCookies = adminLoginRes.headers['set-cookie'];
        const adminCookie = adminCookies[0].split(';')[0];
        log("✅ Admin logged in");

        // --- STEP 4: Admin Checks Conversations ---
        log("\n📋 Admin fetching conversations...");
        const convRes = await axios.get(`${BASE_URL}/chat/admin/conversations`, {
            headers: { Cookie: adminCookie }
        });

        log(`Conversations found: ${convRes.data.conversations.length}`);
        const conversation = convRes.data.conversations.find(c => c.userId._id === userDoc._id.toString());

        if (!conversation) {
            log("Raw conversations:");
            console.log(JSON.stringify(convRes.data.conversations, null, 2));
            throw new Error("Conversation not found for user");
        }
        log("✅ Conversation found");

        // --- STEP 5: Admin Replies ---
        log("\n↩️ Admin replying to User...");
        await axios.post(`${BASE_URL}/chat/send`, {
            text: "Hello! How can I assist you?",
            receiverId: userDoc._id.toString()
        }, {
            headers: { Cookie: adminCookie }
        });
        log("✅ Reply sent successfully");

        // --- STEP 6: User Checks Messages ---
        log("\n📥 User checking messages...");
        const messagesRes = await axios.get(`${BASE_URL}/chat/messages`, {
            headers: { Cookie: userCookie }
        });

        const messages = messagesRes.data.messages;
        log(`Messages count: ${messages.length}`);
        const hasAdminReply = messages.some(m => m.sender === "Prepvio" && m.text === "Hello! How can I assist you?");

        if (hasAdminReply) {
            log("✅ User received Admin's reply!");
            log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Chat System is fully functional.");
        } else {
            throw new Error("User did not receive admin reply");
        }

    } catch (error) {
        if (error.response) {
            log(`❌ HTTP Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            log(`❌ Error: ${error.message}`);
        }
    } finally {
        process.exit(0);
    }
}

runTest();