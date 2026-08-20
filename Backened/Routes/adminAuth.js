import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../Models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Admin Login Attempt:", { email, passwordReceived: !!password });

        // Try database authentication first
        try {
            const user = await User.findOne({
                $or: [{ email: email.toLowerCase() }, { userId: email }]
            }).select("+password");

            console.log("User found:", user ? { id: user._id, email: user.email, userId: user.userId, role: user.role, hasPassword: !!user.password } : "NOT FOUND");

            if (user) {
                const isPasswordValid = await bcryptjs.compare(password, user.password);
                console.log("Password check:", isPasswordValid);

                if (isPasswordValid) {
                    // Check if user has admin privileges
                    if (user.role !== "admin" && user.role !== "superadmin") {
                        return res.status(403).json({
                            success: false,
                            message: "Access denied - Admin credentials required"
                        });
                    }

                    const token = jwt.sign(
                        { id: user._id, email: user.email, role: user.role, isAdmin: true },
                        process.env.JWT_SECRET,
                        { expiresIn: "7d" }
                    );

                    console.log("✅ Admin login successful (database)");
                    return res.status(200).json({
                        success: true,
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            userId: user.userId, // ✅ Added userId
                            phone: user.phone    // ✅ Added phone
                        }
                    });
                }
            }
        } catch (dbError) {
            console.warn("⚠️ Database authentication failed:", dbError.message);
            console.log("Attempting fallback authentication...");
        }

        // FALLBACK: Check hardcoded admin credentials from .env
        // This allows admin login even when MongoDB is unavailable
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                const token = jwt.sign(
                    { id: "admin", email: process.env.ADMIN_EMAIL, role: "admin", isAdmin: true },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                console.log("✅ Admin login successful (fallback .env credentials)");
                return res.status(200).json({
                    success: true,
                    token,
                    user: {
                        name: "Admin",
                        email: process.env.ADMIN_EMAIL,
                        role: "admin"
                    }
                });
            }
        }

        console.log("❌ Login failed: Invalid credentials");
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });

    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Seed admin users endpoint
router.post("/seed", async (req, res) => {
    try {
        const admins = [
            {
                userId: "PRV001",
                password: "Sw@p1910",
                name: "swaroop Bhati",
                email: "swaroopbhati361@gmail.com",
                phone: "7433877151"
            },
            {
                userId: "PRV002",
                password: "Sw@f3118",
                name: "suwaibha Fatima",
                email: "suwaibharauf08@gmail.com",
                phone: "8317347169"
            },
            {
                userId: "PRV003",
                password: "Sw@f3118",
                name: "Sunny Singh",
                email: "as7646477@gmail.com",
                phone: "9026566481"
            },
            {
                userId: "PRV004",
                password: "Sw@f3118",
                name: "Syed Ameen",
                email: "ameensyed244@gmail.com",
                phone: "8050164769"
            },
            {
                userId: "PRV005",
                password: "Sw@f3118",
                name: "Mohammed Afnan Ahmed",
                email: "mohmmedafnanaahmed@gmail.com",
                phone: "8951553975"
            }
        ];

        const results = [];

        for (const admin of admins) {
            // Check if user exists by email or userId
            let user = await User.findOne({
                $or: [{ email: admin.email.toLowerCase() }, { userId: admin.userId }]
            });

            const hashedPassword = await bcryptjs.hash(admin.password, 10);

            if (user) {
                // Update existing user
                user.role = "admin";
                user.userId = admin.userId;
                user.password = hashedPassword;
                user.phone = admin.phone;
                user.name = admin.name;
                user.isVerified = true;

                await user.save();
                results.push({ status: "updated", name: admin.name, email: admin.email });
            } else {
                // Create new user
                const newUser = new User({
                    userId: admin.userId,
                    name: admin.name,
                    email: admin.email,
                    password: hashedPassword,
                    phone: admin.phone,
                    role: "admin",
                    isVerified: true,
                    verificationToken: undefined,
                    verificationTokenExpiresAt: undefined,
                    lastLogin: new Date()
                });

                await newUser.save();
                results.push({ status: "created", name: admin.name, email: admin.email });
            }
        }

        res.status(200).json({
            success: true,
            message: "Admin users seeded successfully",
            results
        });

    } catch (error) {
        console.error("Seed error:", error);
        res.status(500).json({ success: false, message: "Failed to seed admins", error: error.message });
    }
});

export default router;