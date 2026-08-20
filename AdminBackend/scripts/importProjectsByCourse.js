import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";
import Course from "../Server/models/Course.js";
import ProjectMap from "../Server/models/ProjectMap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usage = `
Usage:
  npm run import:projects -- <path-to-all_projects.json>
  npm run import:projects -- <path-to-all_projects.json> --dry-run

Options:
  --dry-run          Parse and group the JSON without writing to MongoDB.
  --strict-courses  Fail if any JSON course cannot be matched to a Course document.
`;

const arrayValue = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const optionalDate = (value) => {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeName = (value) => String(value || "").trim().toLowerCase();
const normalizeSlug = (value) => slugify(String(value || ""), { lower: true, strict: true });
const normalizeCourseText = (value) => String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]/g, "");
const singularizeCompact = (value) => value.endsWith("s") ? value.slice(0, -1) : value;

const editDistance = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    return dp[a.length][b.length];
};

const transformProject = (project) => ({
    sourceId: project.id,
    slug: project.slug,
    projectNumber: Number(project.project_number) || 0,
    title: project.title,
    description: project.description,
    industryPhase: project.industry_phase,
    detailedDescription: project.detailed_description,
    coreLogicAndStructure: arrayValue(project.core_logic_and_structure),
    skillsCovered: arrayValue(project.skills_covered),
    conceptsCovered: arrayValue(project.concepts_covered),
    hints: arrayValue(project.hints),
    notToDo: arrayValue(project.not_to_do),
    toolsRequired: {
        primary: arrayValue(project.tools_required?.primary),
        alternate: arrayValue(project.tools_required?.alternate)
    },
    duration: {
        min: Number(project.duration_min) || undefined,
        max: Number(project.duration_max) || undefined,
        unit: project.duration_unit,
        display: project.duration_display
    },
    tags: arrayValue(project.tags),
    status: project.status || "published",
    sourceCreatedAt: optionalDate(project.created_at),
    sourceUpdatedAt: optionalDate(project.updated_at)
});

const groupProjectsByCourse = (projects) => {
    const courses = new Map();

    for (const project of projects) {
        const requiredFields = ["course_id", "course_name", "level_key", "level_order", "level_label", "id", "slug", "title", "description"];
        const missing = requiredFields.filter((field) => project[field] === undefined || project[field] === null || project[field] === "");

        if (missing.length > 0) {
            throw new Error(`Project ${project.id || "(unknown)"} is missing required field(s): ${missing.join(", ")}`);
        }

        if (!courses.has(project.course_id)) {
            courses.set(project.course_id, {
                courseKey: project.course_id,
                courseName: project.course_name,
                fieldId: project.field_id,
                fieldName: project.field_name,
                levelsByKey: new Map()
            });
        }

        const course = courses.get(project.course_id);
        if (!course.levelsByKey.has(project.level_key)) {
            course.levelsByKey.set(project.level_key, {
                key: project.level_key,
                order: Number(project.level_order),
                label: project.level_label,
                projects: []
            });
        }

        course.levelsByKey.get(project.level_key).projects.push(transformProject(project));
    }

    return Array.from(courses.values())
        .map((course) => ({
            courseKey: course.courseKey,
            courseName: course.courseName,
            fieldId: course.fieldId,
            fieldName: course.fieldName,
            levels: Array.from(course.levelsByKey.values())
                .map((level) => ({
                    ...level,
                    projects: level.projects.sort((a, b) => a.projectNumber - b.projectNumber)
                }))
                .sort((a, b) => a.order - b.order)
        }))
        .sort((a, b) => a.courseName.localeCompare(b.courseName));
};

const loadCourseIndexes = async () => {
    const courses = await Course.find({}, "_id name slug").lean();
    const byName = new Map();
    const bySlug = new Map();
    const byCompact = new Map();

    for (const course of courses) {
        byName.set(normalizeName(course.name), course);
        if (course.slug) bySlug.set(course.slug, course);

        for (const key of [
            normalizeCourseText(course.name),
            singularizeCompact(normalizeCourseText(course.name)),
            normalizeCourseText(course.slug)
        ]) {
            if (key && !byCompact.has(key)) byCompact.set(key, course);
        }
    }

    return { byName, bySlug, byCompact, courses };
};

const findMatchingCourse = (projectMap, indexes) => {
    const compactCandidates = [
        normalizeCourseText(projectMap.courseName),
        singularizeCompact(normalizeCourseText(projectMap.courseName)),
        normalizeCourseText(projectMap.courseKey)
    ];

    const compactMatch = compactCandidates
        .map((candidate) => indexes.byCompact.get(candidate))
        .find(Boolean);

    if (compactMatch) return compactMatch;

    const fuzzyCandidate = compactCandidates.find((candidate) => candidate.length >= 8);
    const fuzzyMatch = fuzzyCandidate
        ? indexes.courses.find((course) => editDistance(fuzzyCandidate, normalizeCourseText(course.name)) <= 1)
        : null;

    return (
        indexes.byName.get(normalizeName(projectMap.courseName)) ||
        indexes.bySlug.get(normalizeSlug(projectMap.courseKey)) ||
        indexes.bySlug.get(normalizeSlug(projectMap.courseName)) ||
        fuzzyMatch ||
        null
    );
};

const configureDnsForAtlas = () => {
    const configuredServers = (process.env.MONGO_DNS_SERVERS || "")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);

    if (configuredServers.length > 0) {
        dns.setServers(configuredServers);
        return;
    }

    const activeServers = dns.getServers();
    if (activeServers.length > 0 && activeServers.every((server) => server.startsWith("127."))) {
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
    }
};

const printSummary = (projectMaps) => {
    const totalProjects = projectMaps.reduce(
        (total, course) => total + course.levels.reduce((sum, level) => sum + level.projects.length, 0),
        0
    );

    console.log(`Grouped ${totalProjects} projects into ${projectMaps.length} course project maps.`);

    for (const projectMap of projectMaps.slice(0, 10)) {
        const levels = projectMap.levels
            .map((level) => `${level.order}:${level.key}(${level.projects.length})`)
            .join(", ");
        console.log(`- ${projectMap.courseKey} | ${projectMap.courseName} | ${levels}`);
    }

    if (projectMaps.length > 10) {
        console.log(`...and ${projectMaps.length - 10} more courses.`);
    }
};

const main = async () => {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const strictCourses = args.includes("--strict-courses");
    const inputArg = args.find((arg) => !arg.startsWith("--"));

    if (!inputArg) {
        console.error(usage);
        process.exitCode = 1;
        return;
    }

    const inputPath = path.resolve(process.cwd(), inputArg);
    const raw = fs.readFileSync(inputPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error("Expected the input JSON to be an array of project objects.");
    }

    const projectMaps = groupProjectsByCourse(parsed);
    printSummary(projectMaps);

    if (dryRun) {
        console.log("Dry run complete. No database writes were made.");
        return;
    }

    dotenv.config({ path: path.resolve(__dirname, "../.env") });

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing. Add it to AdminBackend/.env before importing.");
    }

    configureDnsForAtlas();
    await mongoose.connect(process.env.MONGO_URI);

    try {
        const indexes = await loadCourseIndexes();
        const courseMatches = projectMaps.map((projectMap) => ({
            projectMap,
            course: findMatchingCourse(projectMap, indexes)
        }));
        const missingCourses = courseMatches
            .filter(({ course }) => !course)
            .map(({ projectMap }) => `${projectMap.courseKey} (${projectMap.courseName})`);

        if (strictCourses && missingCourses.length > 0) {
            console.warn(`Could not match ${missingCourses.length} course(s) in MongoDB:`);
            for (const course of missingCourses) {
                console.warn(`- ${course}`);
            }
            throw new Error("Import aborted before writing because --strict-courses was set and some courses were missing.");
        }

        let imported = 0;

        for (const { projectMap, course } of courseMatches) {
            const update = {
                courseKey: projectMap.courseKey,
                courseName: projectMap.courseName,
                fieldId: projectMap.fieldId,
                fieldName: projectMap.fieldName,
                levels: projectMap.levels
            };

            const updateOperation = course
                ? { $set: { ...update, courseId: course._id } }
                : { $set: update, $unset: { courseId: "" } };

            await ProjectMap.findOneAndUpdate(
                { courseKey: projectMap.courseKey },
                updateOperation,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (course) {
                await Course.updateOne(
                    { _id: course._id },
                    { $set: { totalLevels: projectMap.levels.length } }
                );
            }

            imported += 1;
        }

        if (missingCourses.length > 0) {
            console.warn(`Could not match ${missingCourses.length} course(s) in MongoDB:`);
            for (const course of missingCourses) {
                console.warn(`- ${course}`);
            }
        }

        console.log(`Imported ${imported} project map document(s).`);
    } finally {
        await mongoose.disconnect();
    }
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
