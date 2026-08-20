import mongoose from "mongoose";

const projectLevelItemSchema = new mongoose.Schema({
    sourceId: { type: String, required: true },
    slug: { type: String, required: true },
    projectNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    industryPhase: { type: String },
    detailedDescription: { type: String },
    coreLogicAndStructure: [{ type: String }],
    skillsCovered: [{ type: String }],
    conceptsCovered: [{ type: String }],
    hints: [{ type: String }],
    notToDo: [{ type: String }],
    toolsRequired: {
        primary: [{ type: String }],
        alternate: [{ type: String }]
    },
    duration: {
        min: { type: Number },
        max: { type: Number },
        unit: { type: String },
        display: { type: String }
    },
    tags: [{ type: String }],
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "published"
    },
    sourceCreatedAt: { type: Date },
    sourceUpdatedAt: { type: Date }
}, { _id: false });

const projectLevelSchema = new mongoose.Schema({
    key: { type: String, required: true },
    order: { type: Number, required: true },
    label: { type: String, required: true },
    projects: [projectLevelItemSchema]
}, { _id: false });

const projectMapSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    },
    courseKey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    fieldId: { type: String, trim: true },
    fieldName: { type: String, trim: true },
    levels: [projectLevelSchema]
}, { timestamps: true });

projectMapSchema.index({ courseId: 1 }, { sparse: true });

const ProjectMap = mongoose.models.ProjectMap || mongoose.model("ProjectMap", projectMapSchema);
export default ProjectMap;
