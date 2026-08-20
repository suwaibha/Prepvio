import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./Models/User.js";

dotenv.config();

const testUsers = [
    {
        name: "Revenue Tester 1",
        email: "revenue1@test.com",
        userId: "REV001",
        password: "password123", // Dummy, won't be used for login
        subscription: {
            active: true,
            planId: "pro",
            planName: "Pro Plan",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            interviewsTotal: 10,
            interviewsRemaining: 10
        },
        payments: [
            {
                amount: 2900, // $29.00
                status: "success",
                paidAt: new Date(),
                productType: "subscription",
                planId: "pro",
                orderId: "ord_test_001",
                paymentId: "pay_test_001",
                provider: "stripe"
            }
        ]
    },
    {
        name: "Revenue Tester 2",
        email: "revenue2@test.com",
        userId: "REV002",
        password: "password123",
        subscription: {
            active: true,
            planId: "enterprise",
            planName: "Enterprise Plan",
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 year
        },
        payments: [
            {
                amount: 9900, // $99.00
                status: "success",
                paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                productType: "subscription",
                planId: "enterprise",
                orderId: "ord_test_002",
                paymentId: "pay_test_002",
                provider: "stripe"
            },
            {
                amount: 1500, // $15.00 extra credit
                status: "success",
                paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                productType: "interviews",
                orderId: "ord_test_003",
                paymentId: "pay_test_003",
                provider: "stripe"
            }
        ]
    }
];

const seedRevenue = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        for (const userData of testUsers) {
            let user = await User.findOne({ email: userData.email });

            if (user) {
                console.log(`Updating existing test user: ${userData.name}`);
                user.subscription = userData.subscription;

                // Add new payments if not exists (simple check by orderId)
                for (const newPayment of userData.payments) {
                    const exists = user.payments.some(p => p.orderId === newPayment.orderId);
                    if (!exists) {
                        user.payments.push(newPayment);
                    }
                }

                await user.save();
            } else {
                console.log(`Creating new test user: ${userData.name}`);
                const newUser = new User(userData);
                await newUser.save();
            }
        }

        console.log("🎉 Revenue test data seeded successfully.");

    } catch (error) {
        console.error("❌ Error seeding revenue data:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedRevenue();