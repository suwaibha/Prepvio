import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import ProjectMap from "../models/ProjectMap.js";

const router = express.Router();

const PROJECT_THUMBNAILS = [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800"
];

const difficultyByLevelKey = {
    foundation: "Easy",
    easy: "Easy",
    medium_1: "Medium",
    medium_2: "Hard",
    hard: "Expert"
};

const xpByDifficulty = {
    Easy: 250,
    Medium: 500,
    Hard: 750,
    Expert: 1000,
    "Final Boss": 1500
};

const getProjectMapForCourse = async (courseIdOrKey) => {
    const query = [{ courseKey: courseIdOrKey }];

    if (mongoose.Types.ObjectId.isValid(courseIdOrKey)) {
        query.push({ courseId: courseIdOrKey });
    }

    return ProjectMap.findOne({ $or: query });
};

const flattenProjectMap = (projectMap) => {
    const map = typeof projectMap.toObject === "function" ? projectMap.toObject() : projectMap;
    let order = 1;

    return [...(map.levels || [])]
        .sort((a, b) => a.order - b.order)
        .flatMap((level, levelIndex) => {
            const difficulty = difficultyByLevelKey[level.key] || "Medium";

            return [...(level.projects || [])]
                .sort((a, b) => a.projectNumber - b.projectNumber)
                .map((project) => {
                    const currentOrder = order++;

                    return {
                        _id: project.sourceId,
                        sourceId: project.sourceId,
                        sourceMapId: map._id,
                        courseId: map.courseId,
                        courseKey: map.courseKey,
                        courseName: map.courseName,
                        level: {
                            key: level.key,
                            order: level.order,
                            label: level.label
                        },
                        levelKey: level.key,
                        levelOrder: level.order,
                        levelLabel: level.label,
                        title: project.title,
                        difficulty,
                        estimatedTime: project.duration?.display || "2-3 days",
                        xp: xpByDifficulty[difficulty] || 500,
                        tech: project.skillsCovered?.length ? project.skillsCovered : project.tags || [],
                        description: project.detailedDescription || project.description,
                        shortDescription: project.description,
                        thumbnail: PROJECT_THUMBNAILS[levelIndex % PROJECT_THUMBNAILS.length],
                        unlocks: currentOrder > 1 ? [currentOrder - 1] : [],
                        rating: 4.8,
                        completionRate: 0,
                        impact: project.industryPhase,
                        milestones: project.coreLogicAndStructure || [],
                        color: "",
                        order: currentOrder,
                        requiredCourseCompletion: true,
                        conceptsCovered: project.conceptsCovered || [],
                        hints: project.hints || [],
                        notToDo: project.notToDo || [],
                        toolsRequired: project.toolsRequired || {},
                        duration: project.duration || {},
                        tags: project.tags || [],
                        status: project.status
                    };
                });
        });
};

// Create flat project manually
router.post("/", async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get flat projects. Add ?grouped=true to inspect grouped course maps.
router.get("/", async (req, res) => {
    try {
        if (req.query.grouped === "true") {
            const projectMaps = await ProjectMap.find()
                .populate("courseId")
                .sort({ courseName: 1 });
            return res.json(projectMaps);
        }

        const projects = await Project.find().sort({ order: 1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get grouped project map documents.
router.get("/maps", async (req, res) => {
    try {
        const projectMaps = await ProjectMap.find()
            .populate("courseId")
            .sort({ courseName: 1 });
        res.json(projectMaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get one grouped project map by course ObjectId or source course key.
router.get("/map/by-course/:courseId", async (req, res) => {
    try {
        const projectMap = await getProjectMapForCourse(req.params.courseId);
        if (!projectMap) {
            return res.status(404).json({ message: "Project map not found for this course" });
        }

        res.json(projectMap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get projects by course ID. Grouped maps are flattened for the current frontend.
router.get("/by-course/:courseId", async (req, res) => {
    try {
        const projectMap = await getProjectMapForCourse(req.params.courseId);
        if (projectMap) {
            return res.json(flattenProjectMap(projectMap));
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
            return res.json([]);
        }

        const projects = await Project.find({ courseId: req.params.courseId }).sort({ order: 1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single flat project.
router.get("/:id", async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update flat project.
router.put("/:id", async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!project) return res.status(404).json({ message: "Project not found" });
        res.json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete flat project.
router.delete("/:id", async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        res.json({ message: "Project deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
