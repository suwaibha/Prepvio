import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./Models/Category.js";

dotenv.config();

/**
 * Fixed taxonomy — one collection document per category,
 * storing its valid subcategories and a question count.
 */
const CATEGORIES = [
    {
        name: "Engineering",
        subcategories: [
            "ECE", "Chemical", "Civil", "Mechanical",
            "Digital Electronics", "Basic Electronics",
            "Electronic Devices", "EEE", "Biochemical"
        ],
    },
    {
        name: "Computer Science",
        subcategories: ["General", "Database", "Networking"],
    },
    {
        name: "Programming",
        subcategories: ["Python", "C", "C++", "C#", "Java"],
    },
    {
        name: "Biology",
        subcategories: ["Microbiology", "Biochemistry", "Biotechnology"],
    },
    {
        name: "Reasoning",
        subcategories: ["Logical", "Verbal Reasoning", "Non-Verbal"],
    },
    {
        name: "Verbal",
        subcategories: ["Verbal Ability"],
    },
    {
        name: "Aptitude",
        subcategories: ["General", "Data Interpretation"],
    },
];

// Question counts from classified_questions.json metadata
const QUESTION_COUNTS = {
    "Engineering":      37339,
    "Computer Science":  5438,
    "Programming":       2698,
    "Biology":           3204,
    "Reasoning":         1914,
    "Verbal":            1397,
    "Aptitude":           926,
};

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Drop existing categories collection to start fresh
        const existing = await Category.countDocuments();
        if (existing > 0) {
            console.log(`Found ${existing} existing categories. Dropping...`);
            await Category.deleteMany({});
        }

        for (const cat of CATEGORIES) {
            const category = new Category({
                name: cat.name,
                subcategories: cat.subcategories,
                questionCount: QUESTION_COUNTS[cat.name] || 0,
            });

            await category.save();
            console.log(`Created category: ${cat.name} (${cat.subcategories.length} subcategories, ${QUESTION_COUNTS[cat.name] || 0} questions)`);
        }

        console.log(`\nAll ${CATEGORIES.length} categories seeded successfully.`);

    } catch (error) {
        console.error("Error seeding categories:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedCategories();
