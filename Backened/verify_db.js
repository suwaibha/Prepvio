import mongoose from "mongoose";
import dotenv from "dotenv";
import CodingProblem from "./Models/CodingProblem.js";

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for verification");

        const count = await CodingProblem.countDocuments();
        console.log(`Total Coding Problems in DB: ${count}`);

        // Fetch a random problem to inspect
        const randomProblem = await CodingProblem.findOne({ problemId: "20" }); // Valid Parentheses
        if (randomProblem) {
            console.log("\nSample Problem: Valid Parentheses");
            console.log("--------------------------------");
            console.log(`ID: ${randomProblem.problemId}`);
            console.log(`Title: ${randomProblem.title}`);
            console.log(`Difficulty: ${randomProblem.difficulty}`);
            console.log(`FunctionName: ${randomProblem.functionName}`);
            console.log(`Params: ${randomProblem.params}`);
            console.log(`Topics: ${randomProblem.topics}`);
            console.log(`Boilerplate Languages: ${Object.keys(randomProblem.boilerplate || {})}`);
            console.log(`Parsed TestCases:`, randomProblem.testCases);
        } else {
            console.log("Problem ID 20 not found.");
        }

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

verify();
