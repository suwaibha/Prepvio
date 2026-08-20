export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
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

    // Check if subscription has expired
    if (new Date() > new Date(user.subscription.endDate)) {
      await User.findByIdAndUpdate(userId, {
        "subscription.active": false
      });
      
      return res.status(403).json({ 
        message: "Subscription expired",
        requiresPayment: true 
      });
    }

    // Check interview credits
    if (user.subscription.interviewsRemaining <= 0) {
      return res.status(403).json({ 
        message: "No interview credits remaining",
        needsUpgrade: true 
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Subscription check failed" });
  }
};