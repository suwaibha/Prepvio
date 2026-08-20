import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    subcategories: [{
        type: String,
        trim: true,
    }],
    questionCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
