import mongoose from "mongoose";
import dotenv from "dotenv";
import { PromoCode } from "../Models/PromoCode.js";

dotenv.config();

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// Sample promo codes to create
const samplePromoCodes = [
    {
        code: "WELCOME10",
        description: "10% off for new users",
        discountType: "percentage",
        discountValue: 10,
        maxDiscount: 100,
        minPurchaseAmount: 0,
        applicablePlans: [], // Applicable to all plans
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        active: true,
    },
    {
        code: "SAVE50",
        description: "Flat ₹50 off on any plan",
        discountType: "fixed",
        discountValue: 50,
        minPurchaseAmount: 100,
        applicablePlans: [],
        usageLimit: 50,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        active: true,
    },
    {
        code: "PREMIUM20",
        description: "20% off on Premium and Yearly plans",
        discountType: "percentage",
        discountValue: 20,
        maxDiscount: 200,
        minPurchaseAmount: 0,
        applicablePlans: ["premium", "yearly"],
        usageLimit: 30,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        active: true,
    },
    {
        code: "LIFETIME100",
        description: "₹100 off on Lifetime plan",
        discountType: "fixed",
        discountValue: 100,
        minPurchaseAmount: 500,
        applicablePlans: ["lifetime"],
        usageLimit: 20,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        active: true,
    },
    {
        code: "EARLYBIRD",
        description: "25% off - Limited time offer",
        discountType: "percentage",
        discountValue: 25,
        maxDiscount: 250,
        minPurchaseAmount: 200,
        applicablePlans: [],
        usageLimit: null, // Unlimited usage
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        active: true,
    },
    {
        code: "PREP29",
        description: "Special Offer: Get any plan for just ₹29!",
        discountType: "fixed_price",
        discountValue: 29,
        minPurchaseAmount: 0,
        applicablePlans: [], // All plans
        usageLimit: null,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: null, // No expiry
        active: true,
    },
];

async function createPromoCodes() {
    try {
        // Clear existing promo codes (optional - remove in production)
        await PromoCode.deleteMany({});
        console.log("🗑️  Cleared existing promo codes");

        // Create new promo codes
        const created = await PromoCode.insertMany(samplePromoCodes);
        console.log(`✅ Created ${created.length} promo codes:`);

        created.forEach((promo) => {
            console.log(`   - ${promo.code}: ${promo.description}`);
        });

        mongoose.connection.close();
        console.log("\n✅ Database connection closed");
    } catch (error) {
        console.error("❌ Error creating promo codes:", error);
        mongoose.connection.close();
    }
}

createPromoCodes();
