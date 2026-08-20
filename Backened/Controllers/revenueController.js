import { User } from "../Models/User.js";

// --- GET REVENUE OVERVIEW ---
export const getOverview = async (req, res) => {
    try {
        // 1. Calculate Total Revenue
        const revenueAgg = await User.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.status": "success" } },
            { $group: { _id: null, totalRevenue: { $sum: "$payments.amount" } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

        // 2. Count Active Subscriptions
        const activeSubs = await User.countDocuments({ "subscription.active": true });

        // 3. Count Total Users (for conversion rate & avg revenue)
        const totalUsers = await User.countDocuments();

        // 4. Calculate Average Revenue Per User (ARPU)
        // ARPU = Total Revenue / Total Users
        const arpu = totalUsers > 0 ? (totalRevenue / totalUsers) : 0;

        // 5. Calculate Conversion Rate
        // Users who have made at least one successful payment
        const payingUsersAgg = await User.aggregate([
            { $match: { "payments.status": "success" } },
            { $group: { _id: "$_id" } }, // Group by user ID to count unique users
            { $count: "count" }
        ]);
        const payingUsersCount = payingUsersAgg.length > 0 ? payingUsersAgg[0].count : 0;
        const conversionRate = totalUsers > 0 ? ((payingUsersCount / totalUsers) * 100) : 0;

        // 6. Daily Active Users (Proxy for Daily Visitors)
        const dailyVisitors = await User.countDocuments({
            lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.json({
            success: true,
            totalRevenue,
            activeSubs,
            arpu,
            conversionRate,
            totalUsers,
            payingUsersCount,
            dailyVisitors
        });

    } catch (error) {
        console.error("Get revenue overview error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch revenue overview" });
    }
};

// --- GET ANALYTICS (Charts) ---
export const getAnalytics = async (req, res) => {
    try {
        // 1. Monthly Revenue Growth (Last 6-12 months)
        const revenueGrowth = await User.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.status": "success" } },
            {
                $group: {
                    _id: {
                        month: { $month: "$payments.paidAt" },
                        year: { $year: "$payments.paidAt" }
                    },
                    total: { $sum: "$payments.amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for chart (e.g., "Jan 2024")
        const formattedGrowth = revenueGrowth.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                value: item.total
            };
        });

        // 2. Service Usage (AI Interview, Learn, Perform)
        const [aiCount, learnCount, performCount] = await Promise.all([
            User.countDocuments({ "interviewAttempts.0": { $exists: true } }),
            User.countDocuments({ "courseProgress.0": { $exists: true } }),
            User.countDocuments({ "aptitudeAttempts.0": { $exists: true } })
        ]);

        const serviceUsage = [
            { name: 'AI Interview', active: aiCount },
            { name: 'Learn', active: learnCount },
            { name: 'Perform', active: performCount }
        ];

        // 3. Subscription Mix (Distribution by Plan)
        const subMix = await User.aggregate([
            { $match: { "subscription.active": true } },
            {
                $group: {
                    _id: "$subscription.planId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedMix = subMix.map(item => ({
            name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : "Unknown",
            value: item.count
        }));

        res.json({
            success: true,
            revenueGrowth: formattedGrowth,
            serviceUsage,
            subscriptionMix: formattedMix
        });

    } catch (error) {
        console.error("Get analytics error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
};

// --- GET ALL INVOICES ---
export const getInvoices = async (req, res) => {
    try {
        // Fetch all successful payments flattened
        const invoices = await User.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.status": "success" } },
            { $sort: { "payments.paidAt": -1 } },
            {
                $project: {
                    _id: 0,
                    invoiceId: "$payments.orderId",
                    user: { name: "$name", email: "$email", avatar: "$avatarUrl" },
                    amount: "$payments.amount",
                    plan: "$payments.planId", // or productType
                    status: "$payments.status",
                    date: "$payments.paidAt"
                }
            },
            { $limit: 100 } // Limit to last 100 transactions for performance (implement pagination later)
        ]);

        res.json({
            success: true,
            invoices
        });

    } catch (error) {
        console.error("Get invoices error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
};

// --- GET ACTIVE SUBSCRIPTIONS ---
export const getActiveSubscriptions = async (req, res) => {
    try {
        const subscribers = await User.find({ "subscription.active": true })
            .select("name email avatarUrl subscription")
            .sort({ "subscription.startDate": -1 });

        res.json({
            success: true,
            subscribers
        });
    } catch (error) {
        console.error("Get active subscriptions error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch subscriptions" });
    }
};