import express from "express";
import { PromoCode } from "../Models/PromoCode.js";
import { User } from "../Models/User.js";
import { verifyToken } from "../middleware/verifytoken.js";
import { PLANS } from "../config/plans.js";

const router = express.Router();

/* ===========================
   VALIDATE PROMO CODE
=========================== */
router.post("/validate", verifyToken, async (req, res) => {
    try {
        const { code, planId } = req.body;
        const userId = req.userId;

        if (!code) {
            return res.status(400).json({ message: "Promo code is required" });
        }

        if (!planId) {
            return res.status(400).json({ message: "Plan ID is required" });
        }

        // Find the promo code
        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase()
        });

        if (!promoCode) {
            return res.status(404).json({
                valid: false,
                message: "Invalid promo code"
            });
        }

        // Check if promo code is valid
        const validityCheck = promoCode.isValid();
        if (!validityCheck.valid) {
            return res.status(400).json({
                valid: false,
                message: validityCheck.reason
            });
        }

        // Check if user can use this promo code
        const userCheck = promoCode.canUserUse(userId);
        if (!userCheck.canUse) {
            return res.status(400).json({
                valid: false,
                message: userCheck.reason
            });
        }

        // Check if promo code is applicable to the selected plan
        if (promoCode.applicablePlans.length > 0 &&
            !promoCode.applicablePlans.includes(planId)) {
            return res.status(400).json({
                valid: false,
                message: "This promo code is not applicable to the selected plan"
            });
        }

        // Get plan details
        const plan = PLANS[planId];
        if (!plan) {
            return res.status(400).json({ message: "Invalid plan ID" });
        }

        // Check minimum purchase amount
        if (plan.amount < promoCode.minPurchaseAmount) {
            return res.status(400).json({
                valid: false,
                message: `Minimum purchase amount of ₹${promoCode.minPurchaseAmount} required`
            });
        }

        // Calculate discount
        const discount = promoCode.calculateDiscount(plan.amount);
        const finalAmount = Math.max(0, plan.amount - discount);

        res.json({
            valid: true,
            message: "Promo code applied successfully",
            promoCode: {
                code: promoCode.code,
                description: promoCode.description,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
            },
            pricing: {
                originalAmount: plan.amount,
                discountAmount: discount,
                finalAmount: finalAmount,
            },
        });
    } catch (err) {
        console.error("Validate promo code error:", err);
        res.status(500).json({ message: "Failed to validate promo code" });
    }
});

/* ===========================
   GET ALL ACTIVE PROMO CODES (ADMIN)
=========================== */
router.get("/all", verifyToken, async (req, res) => {
    try {
        const promoCodes = await PromoCode.find({ active: true })
            .select("-usedBy")
            .sort({ createdAt: -1 });

        res.json(promoCodes);
    } catch (err) {
        console.error("Get promo codes error:", err);
        res.status(500).json({ message: "Failed to fetch promo codes" });
    }
});

/* ===========================
   CREATE PROMO CODE (ADMIN)
=========================== */
router.post("/create", verifyToken, async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscount,
            minPurchaseAmount,
            applicablePlans,
            usageLimit,
            perUserLimit,
            validFrom,
            validUntil,
        } = req.body;

        // Basic validation
        if (!code || !discountType || !discountValue) {
            return res.status(400).json({
                message: "Code, discount type, and discount value are required"
            });
        }

        // Check if code already exists
        const existingCode = await PromoCode.findOne({
            code: code.toUpperCase()
        });

        if (existingCode) {
            return res.status(400).json({
                message: "Promo code already exists"
            });
        }

        // Create new promo code
        const promoCode = new PromoCode({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            maxDiscount,
            minPurchaseAmount: minPurchaseAmount || 0,
            applicablePlans: applicablePlans || [],
            usageLimit,
            perUserLimit: perUserLimit || 1,
            validFrom: validFrom || new Date(),
            validUntil,
        });

        await promoCode.save();

        res.status(201).json({
            message: "Promo code created successfully",
            promoCode,
        });
    } catch (err) {
        console.error("Create promo code error:", err);
        res.status(500).json({ message: "Failed to create promo code" });
    }
});

/* ===========================
   DEACTIVATE PROMO CODE (ADMIN)
=========================== */
router.patch("/deactivate/:code", verifyToken, async (req, res) => {
    try {
        const { code } = req.params;

        const promoCode = await PromoCode.findOneAndUpdate(
            { code: code.toUpperCase() },
            { active: false },
            { new: true }
        );

        if (!promoCode) {
            return res.status(404).json({ message: "Promo code not found" });
        }

        res.json({
            message: "Promo code deactivated successfully",
            promoCode,
        });
    } catch (err) {
        console.error("Deactivate promo code error:", err);
        res.status(500).json({ message: "Failed to deactivate promo code" });
    }
});

/* ===========================
   GET PROMO CODE USAGE STATS (ADMIN)
=========================== */
router.get("/stats/:code", verifyToken, async (req, res) => {
    try {
        const { code } = req.params;

        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase()
        }).populate("usedBy.userId", "name email");

        if (!promoCode) {
            return res.status(404).json({ message: "Promo code not found" });
        }

        res.json({
            code: promoCode.code,
            description: promoCode.description,
            usageCount: promoCode.usageCount,
            usageLimit: promoCode.usageLimit,
            active: promoCode.active,
            validFrom: promoCode.validFrom,
            validUntil: promoCode.validUntil,
            usedBy: promoCode.usedBy,
        });
    } catch (err) {
        console.error("Get promo code stats error:", err);
        res.status(500).json({ message: "Failed to fetch promo code stats" });
    }
});

export default router;
