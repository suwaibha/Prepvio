import mongoose from "mongoose";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import { User } from "./Models/User.js";

dotenv.config();

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

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        for (const admin of admins) {
            // Check if user exists by email or userId
            let user = await User.findOne({
                $or: [{ email: admin.email.toLowerCase() }, { userId: admin.userId }]
            });

            const hashedPassword = await bcryptjs.hash(admin.password, 10);

            if (user) {
                console.log(`User found: ${admin.name} (${admin.email}). Updating to ADMIN...`);

                // Update existing user
                user.role = "admin";
                user.userId = admin.userId; // Ensure userId is set
                // user.password = hashedPassword; // Optional: Reset password to the one provided? Let's do it to ensure access.
                // Decided: Yes, update password to ensure they can login with provided credentials.
                user.password = hashedPassword;
                user.phone = admin.phone;
                user.name = admin.name;

                await user.save();
                console.log(`✅ Updated ${admin.name} to Admin.`);
            } else {
                console.log(`Creating new Admin: ${admin.name}...`);

                // Create new user
                const newUser = new User({
                    userId: admin.userId,
                    name: admin.name,
                    email: admin.email,
                    password: hashedPassword,
                    phone: admin.phone,
                    role: "admin",
                    isVerified: true, // Auto-verify admins
                    verificationToken: undefined,
                    verificationTokenExpiresAt: undefined,
                    lastLogin: new Date()
                });

                await newUser.save();
                console.log(`✅ Created Admin ${admin.name}.`);
            }
        }

        console.log("🎉 All admins processed successfully.");

    } catch (error) {
        console.error("❌ Error seeding admins:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedAdmins();