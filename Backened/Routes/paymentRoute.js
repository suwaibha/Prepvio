import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { PLANS } from "../config/plans.js";
import { User } from "../Models/User.js";
import { verifyToken } from "../middleware/verifytoken.js";
import Notification from "../Models/Notification.js";
// NOTE: io is accessed via req.io (attached by server.js middleware) to avoid circular imports

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ===========================
   GET PLANS
=========================== */
router.get("/plans", (req, res) => {
  res.json(PLANS);
});

/* ===========================
   CREATE ORDER
=========================== */
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { planId, promoCode } = req.body;
    const userId = req.userId;

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ message: "Invalid planId" });
    }

    // Fetch user to check for upgrade scenario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Detect if this is an upgrade
    const currentPlan = user.subscription.active ? PLANS[user.subscription.planId] : null;
    const isUpgrade = user.subscription.active &&
      user.subscription.planId !== planId &&
      plan.amount > (currentPlan?.amount || 0);

    // Calculate base amount with upgrade discount
    let baseAmount = plan.amount;
    let upgradeDiscount = 0;
    let previousPlanId = null;

    if (isUpgrade) {
      upgradeDiscount = currentPlan.amount;
      baseAmount = plan.amount - currentPlan.amount;
      previousPlanId = user.subscription.planId;
    }

    let finalAmount = baseAmount;
    let originalAmount = plan.amount;
    let discountAmount = 0;
    let promoCodeData = null;

    // If promo code is provided, validate and apply it on the base amount
    if (promoCode) {
      const { PromoCode } = await import("../Models/PromoCode.js");

      const promo = await PromoCode.findOne({
        code: promoCode.toUpperCase()
      });

      if (!promo) {
        return res.status(404).json({ message: "Invalid promo code" });
      }

      // Validate promo code
      const validityCheck = promo.isValid();
      if (!validityCheck.valid) {
        return res.status(400).json({ message: validityCheck.reason });
      }

      // Check if user can use this promo code
      const userCheck = promo.canUserUse(userId);
      if (!userCheck.canUse) {
        return res.status(400).json({ message: userCheck.reason });
      }

      // Check if applicable to plan
      if (promo.applicablePlans.length > 0 &&
        !promo.applicablePlans.includes(planId)) {
        return res.status(400).json({
          message: "This promo code is not applicable to the selected plan"
        });
      }

      // Check minimum purchase amount (against base amount after upgrade discount)
      if (baseAmount < promo.minPurchaseAmount) {
        return res.status(400).json({
          message: `Minimum purchase amount of ₹${promo.minPurchaseAmount} required`
        });
      }

      // Calculate discount on base amount (after upgrade discount)
      discountAmount = promo.calculateDiscount(baseAmount);
      finalAmount = Math.max(0, baseAmount - discountAmount);
      promoCodeData = promo.code;
    }

    const order = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { planId, userId, promoCode: promoCodeData || "none" },
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        payments: {
          productType: "subscription",
          amount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          promoCode: promoCodeData,
          upgradeDiscount: upgradeDiscount,
          isUpgrade: isUpgrade,
          previousPlanId: previousPlanId,
          provider: "razorpay",
          orderId: order.id,
          status: "pending",
          planId,
          interviewsGranted: plan.interviews,
        },
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      interviews: plan.interviews,
      originalAmount: originalAmount,
      upgradeDiscount: upgradeDiscount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      promoCode: promoCodeData,
      isUpgrade: isUpgrade,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

/* ===========================
   VERIFY PAYMENT
=========================== */
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const user = await User.findById(userId);
    const payment = user.payments.find(
      (p) => p.orderId === razorpay_order_id
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "success") {
      return res.json({
        success: true,
        subscription: user.subscription,
        interviews: {
          remaining: user.subscription.interviewsRemaining,
          total: user.subscription.interviewsTotal,
        },
      });
    }

    const plan = PLANS[payment.planId];

    const startDate = new Date();
    let endDate = new Date(startDate);

    if (payment.planId === "lifetime") {
      endDate = new Date("2099-12-31");
    } else if (payment.planId === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Check if this is a plan change (upgrade, downgrade, or switch)
    const currentPlan = user.subscription.planId;
    const isPlanChange = user.subscription.active && currentPlan !== payment.planId;

    // Determine the number of interviews to grant
    const interviewsToGrant = payment.promoCode === 'PREP29' ? 2 : plan.interviews;

    // Build the update operation based on plan change status
    let updateOperation;

    if (isPlanChange) {
      // Reset credits when switching to a different plan
      updateOperation = {
        $set: {
          "payments.$.paymentId": razorpay_payment_id,
          "payments.$.signature": razorpay_signature,
          "payments.$.status": "success",
          "payments.$.paidAt": new Date(),
          "subscription.active": true,
          "subscription.planId": payment.planId,
          "subscription.planName": plan.name,
          "subscription.startDate": startDate,
          "subscription.endDate": endDate,
          "subscription.interviewsTotal": interviewsToGrant,
          "subscription.interviewsRemaining": interviewsToGrant,
        },
      };
    } else {
      // Add credits for new subscriptions or same-plan renewals
      updateOperation = {
        $set: {
          "payments.$.paymentId": razorpay_payment_id,
          "payments.$.signature": razorpay_signature,
          "payments.$.status": "success",
          "payments.$.paidAt": new Date(),
          "subscription.active": true,
          "subscription.planId": payment.planId,
          "subscription.planName": plan.name,
          "subscription.startDate": startDate,
          "subscription.endDate": endDate,
        },
        $inc: {
          "subscription.interviewsTotal": interviewsToGrant,
          "subscription.interviewsRemaining": interviewsToGrant,
        },
      };
    }

    await User.findOneAndUpdate(
      { _id: userId, "payments.orderId": razorpay_order_id },
      updateOperation
    );

    // If promo code was used, update promo code usage
    if (payment.promoCode) {
      const { PromoCode } = await import("../Models/PromoCode.js");

      await PromoCode.findOneAndUpdate(
        { code: payment.promoCode },
        {
          $inc: { usageCount: 1 },
          $push: {
            usedBy: {
              userId: userId,
              usedAt: new Date(),
              orderId: razorpay_order_id,
              discountApplied: payment.discountAmount,
            },
          },
        }
      );
    }

    // --- PURCHASE NOTIFICATION ---
    try {
      const notificationTitle = "Subscription Activated";
      const notificationMessage = `Your ${plan.name} subscription has been successfully activated. Enjoy your interview prep!`;

      // Create notification in DB
      const newNotification = await Notification.create({
        userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "payment",
        isRead: false,
        metadata: {
          planId: payment.planId,
          orderId: razorpay_order_id,
          amount: payment.amount
        }
      });

      // Emit real-time notification via req.io (avoids circular import from server.js)
      if (req.io) {
        req.io.to(userId.toString()).emit("NEW_NOTIFICATION", newNotification);
      }

    } catch (notifErr) {
      console.error("Error sending purchase notification:", notifErr);
      // Proceed without failing the request
    }

    const updatedUser = await User.findById(userId);

    // In paymentRoute.js, inside the /verify route, replace the final res.json() with:

    res.json({
      success: true,
      subscription: updatedUser.subscription,
      interviews: {
        remaining: updatedUser.subscription.interviewsRemaining,
        total: updatedUser.subscription.interviewsTotal,
      },
      plan: {
        name: plan.name,
        planId: payment.planId,
        amount: plan.amount,
        duration: plan.duration,
      },
      promoApplied: payment.promoCode ? {
        code: payment.promoCode,
        discountAmount: payment.discountAmount,
        originalAmount: payment.originalAmount,
      } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

/* ===========================
   USE INTERVIEW
=========================== */
router.post("/use-interview", verifyToken, async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);

  if (!user.subscription.active) {
    return res.status(403).json({ message: "No active subscription" });
  }

  if (user.subscription.interviewsRemaining <= 0) {
    return res.status(403).json({ message: "No interview credits remaining" });
  }

  await User.findByIdAndUpdate(userId, {
    $inc: {
      "subscription.interviewsUsed": 1,
      "subscription.interviewsRemaining": -1,
    },
  });

  res.json({ success: true });
});

/* ===========================
   INTERVIEW STATUS
=========================== */
router.get("/interview-status", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);

  res.json({
    subscription: user.subscription,
    recentInterviews: user.interviewAttempts.slice(-5),
  });
});

/* ===========================
   CHECK AND CONSUME INTERVIEW CREDIT
=========================== */
router.post("/consume-interview", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if subscription is active
    if (!user.subscription.active) {
      return res.status(403).json({
        message: "No active subscription",
        requiresPayment: true
      });
    }

    // Check if subscription expired
    if (new Date() > new Date(user.subscription.endDate)) {
      await User.findByIdAndUpdate(userId, {
        "subscription.active": false
      });

      return res.status(403).json({
        message: "Subscription expired",
        requiresPayment: true
      });
    }

    // Check if user has remaining interviews
    if (user.subscription.interviewsRemaining <= 0) {
      return res.status(403).json({
        message: "No interview credits remaining",
        needsUpgrade: true
      });
    }

    // ✅ CONSUME ONE INTERVIEW CREDIT
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "subscription.interviewsUsed": 1,
        "subscription.interviewsRemaining": -1,
      },
    });

    res.json({
      success: true,
      remaining: user.subscription.interviewsRemaining - 1
    });

  } catch (err) {
    console.error("Consume interview error:", err);
    res.status(500).json({ message: "Failed to consume interview credit" });
  }
});

/* ===========================
   GET PAYMENT HISTORY
=========================== */
router.get("/history", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter for successful payments and sort by date (newest first)
    const history = user.payments
      .filter(p => p.status === 'success')
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    res.json({ success: true, history });
  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

export default router;
