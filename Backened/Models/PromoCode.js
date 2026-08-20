import mongoose from "mongoose";

/* ======================================================
   PROMO CODE SCHEMA
====================================================== */
const promoCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed", "fixed_price"], // Added fixed_price
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        maxDiscount: {
            type: Number,
            default: null, // For percentage discounts, cap the max discount amount
        },
        minPurchaseAmount: {
            type: Number,
            default: 0,
        },
        applicablePlans: {
            type: [String],
            default: [], // Empty array means applicable to all plans
            enum: ["", "monthly", "premium", "yearly", "lifetime"],
        },
        usageLimit: {
            type: Number,
            default: null, // null means unlimited usage
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        perUserLimit: {
            type: Number,
            default: 1, // How many times a single user can use this code
        },
        usedBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                usedAt: {
                    type: Date,
                    default: Date.now,
                },
                orderId: String,
                discountApplied: Number,
            },
        ],
        active: {
            type: Boolean,
            default: true,
        },
        validFrom: {
            type: Date,
            default: Date.now,
        },
        validUntil: {
            type: Date,
            default: null, // null means no expiry
        },
        createdBy: {
            type: String,
            default: "admin",
        },
    },
    { timestamps: true }
);

// Index for faster lookups
promoCodeSchema.index({ code: 1, active: 1 });

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function () {
    const now = new Date();

    // Check if active
    if (!this.active) {
        return { valid: false, reason: "Promo code is inactive" };
    }

    // Check validity period
    if (this.validFrom && now < this.validFrom) {
        return { valid: false, reason: "Promo code is not yet valid" };
    }

    if (this.validUntil && now > this.validUntil) {
        return { valid: false, reason: "Promo code has expired" };
    }

    // Check usage limit
    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
        return { valid: false, reason: "Promo code usage limit reached" };
    }

    return { valid: true };
};

// Method to check if user can use this promo code
promoCodeSchema.methods.canUserUse = function (userId) {
    const userUsageCount = this.usedBy.filter(
        (usage) => usage.userId.toString() === userId.toString()
    ).length;

    if (userUsageCount >= this.perUserLimit) {
        return { canUse: false, reason: "You have already used this promo code" };
    }

    return { canUse: true };
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function (amount) {
    let discount = 0;

    if (this.discountType === "percentage") {
        discount = (amount * this.discountValue) / 100;

        // Apply max discount cap if set
        if (this.maxDiscount !== null && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }
    } else if (this.discountType === "fixed") {
        discount = this.discountValue;
    } else if (this.discountType === "fixed_price") {
        // For fixed_price, the discountValue is the TARGET PRICE
        // Discount = Original Amount - Target Price
        if (amount > this.discountValue) {
            discount = amount - this.discountValue;
        } else {
            // If the original amount is already less than the target fixed price, 
            // no discount (or you could argue 0 discount, effectively keeping the original lower price)
            discount = 0;
        }
    }

    // Ensure discount doesn't exceed the amount
    if (discount > amount) {
        discount = amount;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Prevent OverwriteModelError in dev / hot reload
export const PromoCode =
    mongoose.models.PromoCode || mongoose.model("PromoCode", promoCodeSchema);
