import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import CodingProblem from "./Models/CodingProblem.js";

dotenv.config();

const BATCH_SIZE = 200;
const PROBLEMS_DIR = path.resolve("./tmp_leetcode/problems");

const seedLeetcodeProblems = async () => {
    try {
        if (!fs.existsSync(PROBLEMS_DIR)) {
            console.error(`Problems directory not found: ${PROBLEMS_DIR}`);
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing CodingProblem documents
        const existingCount = await CodingProblem.countDocuments();
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing coding problems. Dropping collection...`);
            try {
                await CodingProblem.collection.drop();
                console.log("Dropped coding problems collection");
            } catch (dropErr) {
                console.warn("Error dropping collection, proceeding anyway:", dropErr.message);
                await CodingProblem.deleteMany({});
                console.log("Deleted all coding problems documents");
            }
        }

        const files = fs.readdirSync(PROBLEMS_DIR).filter(f => f.endsWith(".json"));
        console.log(`Found ${files.length} JSON problem files in ${PROBLEMS_DIR}`);

        const problems = [];

        for (const file of files) {
            try {
                const filePath = path.join(PROBLEMS_DIR, file);
                const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

                const jsSnippet = data.code_snippets?.javascript || "";
                let functionName = "";
                let params = "";

                if (jsSnippet) {
                    let match = jsSnippet.match(/var\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
                    if (match) {
                        functionName = match[1];
                        params = match[2].trim();
                    } else {
                        match = jsSnippet.match(/function\s+(\w+)\s*\(([^)]*)\)/);
                        if (match) {
                            functionName = match[1];
                            params = match[2].trim();
                        }
                    }
                }

                // If functionName is still missing, try matching on python snippet
                if (!functionName && data.code_snippets?.python3) {
                    const pySnippet = data.code_snippets.python3;
                    const matchPy = pySnippet.match(/def\s+(\w+)\s*\(self,\s*([^)]*)\)/);
                    if (matchPy) {
                        functionName = matchPy[1];
                        params = matchPy[2].trim();
                    }
                }

                if (!functionName) {
                    functionName = "solve";
                }

                const testCases = [];
                if (data.examples && data.examples.length > 0) {
                    for (const ex of data.examples) {
                        if (!ex.example_text) continue;
                        const matchInput = ex.example_text.match(/Input:\s*(.*)/i);
                        const matchOutput = ex.example_text.match(/Output:\s*(.*)/i);
                        if (matchInput && matchOutput) {
                            const rawIn = matchInput[1].trim();
                            const rawOut = matchOutput[1].trim();

                            const parts = rawIn.split(/\b\w+\s*=\s*/);
                            const values = parts.slice(1).map(p => {
                                let val = p.trim();
                                if (val.endsWith(",")) {
                                    val = val.slice(0, -1).trim();
                                }
                                return val;
                            });

                            const cleanInput = values.join(", ");
                            testCases.push({
                                input: cleanInput || rawIn,
                                expected: rawOut
                            });
                        }
                    }
                }

                problems.push({
                    problemId: data.frontend_id || data.problem_id,
                    title: data.title,
                    difficulty: data.difficulty,
                    problemSlug: data.problem_slug,
                    description: data.description || "",
                    examples: data.examples || [],
                    constraints: data.constraints || [],
                    hints: data.hints || [],
                    functionName,
                    params,
                    boilerplate: data.code_snippets || {},
                    testCases: testCases,
                    topics: data.topics || []
                });

            } catch (err) {
                console.error(`Error parsing file ${file}:`, err.message);
            }
        }

        console.log(`Successfully parsed ${problems.length} problems. Seeding...`);
        let inserted = 0;

        for (let i = 0; i < problems.length; i += BATCH_SIZE) {
            const batch = problems.slice(i, i + BATCH_SIZE);
            await CodingProblem.insertMany(batch, { ordered: false });
            inserted += batch.length;
            console.log(`Seeded ${inserted}/${problems.length} problems...`);
        }

        console.log(`All ${inserted} problems seeded successfully!`);

    } catch (err) {
        console.error("Error in seeding process:", err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedLeetcodeProblems();
