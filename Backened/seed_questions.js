import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Question from "./Models/Question.js";

dotenv.config();

const BATCH_SIZE = 500; // MongoDB insertMany batch size
const JSON_PATH = path.resolve("E:/prepvio/classified_questions.json");

const seedQuestions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Load classified questions
        console.log(`Loading ${JSON_PATH}...`);
        const raw = fs.readFileSync(JSON_PATH, "utf-8");
        const data = JSON.parse(raw);
        const questions = data.questions;
        console.log(`Loaded ${questions.length.toLocaleString()} questions`);

        // Check existing count
        const existingCount = await Question.countDocuments();
        if (existingCount > 0) {
            console.log(`Found ${existingCount.toLocaleString()} existing questions. Dropping collection...`);
            await Question.collection.drop();
            console.log("Dropped questions collection");
        }

        // Insert in batches
        const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
        let inserted = 0;

        console.log(`\nInserting ${questions.length.toLocaleString()} questions in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

        for (let i = 0; i < questions.length; i += BATCH_SIZE) {
            const batch = questions.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            await Question.insertMany(batch, { ordered: false });

            inserted += batch.length;
            const pct = ((inserted / questions.length) * 100).toFixed(1);
            process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} | ${inserted.toLocaleString()}/${questions.length.toLocaleString()} (${pct}%)`);
        }

        console.log("\n");

        // Verify
        const finalCount = await Question.countDocuments();
        console.log(`Verification: ${finalCount.toLocaleString()} documents in questions collection`);

        // Print category breakdown from DB
        const breakdown = await Question.aggregate([
            { $group: { _id: { category: "$category", subcategory: "$subcategory" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log("\nCategory breakdown in DB:");
        for (const entry of breakdown) {
            console.log(`  ${entry._id.category} > ${entry._id.subcategory}: ${entry.count.toLocaleString()}`);
        }

        console.log(`\nAll ${finalCount.toLocaleString()} questions seeded successfully.`);

    } catch (error) {
        console.error("Error seeding questions:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedQuestions();
