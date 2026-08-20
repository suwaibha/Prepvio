import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    try {
        let token;

        // 1️⃣ CHECK HEADER FIRST
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2️⃣ CHECK COOKIES
        if (!token) {
            token = req.cookies?.admin_token;
        }

        // 3️⃣ ALLOW PUBLIC GET REQUESTS
        if (req.method === "GET") {
            if (token) {
                try {
                    const secret = process.env.JWT_SECRET || "mydevsecret";
                    const decoded = jwt.verify(token, secret);
                    req.userId = decoded.id;
                    req.isAdmin = !!(decoded.isAdmin || decoded.role === "admin" || decoded.role === "superadmin");
                } catch (err) {
                    // Invalid token for GET is fine, just don't set user
                    console.log("verifyToken info (GET): Invalid token provided, proceeding as guest");
                }
            }
            return next();
        }

        // 4️⃣ RESTRICT OTHERS (POST, PUT, DELETE) TO ADMINS
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - admin token required for modifications",
            });
        }

        const secret = process.env.JWT_SECRET || "mydevsecret";
        const decoded = jwt.verify(token, secret);

        const isAdmin = decoded.isAdmin || decoded.role === "admin" || decoded.role === "superadmin";
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Admin access required for modifications",
            });
        }

        req.userId = decoded.id;
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error("verifyToken error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
