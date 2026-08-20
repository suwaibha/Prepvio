import mongoose from "mongoose";
import dotenv from "dotenv";
import CodingProblem from "./Models/CodingProblem.js";

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await CodingProblem.countDocuments();
  console.log("Total problems:", count);
  const sample = await CodingProblem.findOne();
  console.log("Sample problem:", JSON.stringify(sample, null, 2));

  const missing = await CodingProblem.countDocuments({
    $or: [
      { title: { $exists: false } },
      { description: { $exists: false } },
      { testCases: { $exists: false } }
    ]
  });
  console.log("Missing fields count:", missing);
  process.exit(0);
}

check().catch(console.error);