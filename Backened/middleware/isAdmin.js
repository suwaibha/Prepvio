import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ success: false, message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mydevsecret");

        // Check if role is admin or superadmin
        if (decoded.role !== "admin" && decoded.role !== "superadmin") {
            return res.status(403).json({ success: false, message: "Access denied - Admin role required" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
};