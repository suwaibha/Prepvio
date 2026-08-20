import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Database,
    Layers,
    Loader2,
    RefreshCw,
    Search,
    Server,
    Sparkles,
    Target
} from "lucide-react";
import { CONTENT_API_URL } from "../../../config/api";

const ProjectManagement = () => {
    const [projectMaps, setProjectMaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [linkFilter, setLinkFilter] = useState("all");
    const [expandedCourses, setExpandedCourses] = useState(new Set());

    const API_URL = `${CONTENT_API_URL}/projects/maps`;

    const fetchProjectMaps = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(API_URL, { timeout: 10000 });
            const maps = Array.isArray(res.data) ? res.data : [];
            setProjectMaps(maps);
            setExpandedCourses(new Set(maps.slice(0, 2).map((item) => item.courseKey)));
        } catch (err) {
            console.error("Failed to fetch project maps:", err);
            setError(err.response?.data?.message || "Cannot connect to the content backend.");
            setProjectMaps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectMaps();
    }, []);

    const stats = useMemo(() => {
        const totalCourses = projectMaps.length;
        const totalLevels = projectMaps.reduce((sum, map) => sum + (map.levels?.length || 0), 0);
        const totalProjects = projectMaps.reduce(
            (sum, map) => sum + (map.levels || []).reduce((levelSum, level) => levelSum + (level.projects?.length || 0), 0),
            0
        );
        const linkedCourses = projectMaps.filter((map) => !!map.courseId).length;

        return { totalCourses, totalLevels, totalProjects, linkedCourses };
    }, [projectMaps]);

    const filteredProjectMaps = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return projectMaps.filter((map) => {
            const linked = !!map.courseId;
            const matchesLinkFilter =
                linkFilter === "all" ||
                (linkFilter === "linked" && linked) ||
                (linkFilter === "unlinked" && !linked);

            if (!matchesLinkFilter) return false;
            if (!query) return true;

            return [
                map.courseName,
                map.courseKey,
                map.fieldName,
                ...(map.levels || []).flatMap((level) => [
                    level.key,
                    level.label,
                    ...(level.projects || []).map((project) => project.title)
                ])
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [projectMaps, searchTerm, linkFilter]);

    const toggleCourse = (courseKey) => {
        setExpandedCourses((previous) => {
            const next = new Set(previous);
            if (next.has(courseKey)) next.delete(courseKey);
            else next.add(courseKey);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                                <Database className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Project Maps</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">PrepVioAdmin.projectmaps grouped by course and level</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Search courses or projects"
                                />
                            </div>

                            <select
                                value={linkFilter}
                                onChange={(event) => setLinkFilter(event.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="all">All Maps</option>
                                <option value="linked">Linked Courses</option>
                                <option value="unlinked">Course Key Only</option>
                            </select>

                            <button
                                onClick={fetchProjectMaps}
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={BookOpen} label="Course Maps" value={stats.totalCourses} />
                    <StatCard icon={Layers} label="Levels" value={stats.totalLevels} />
                    <StatCard icon={Target} label="Projects" value={stats.totalProjects} />
                    <StatCard icon={CheckCircle2} label="Linked Courses" value={`${stats.linkedCourses}/${stats.totalCourses}`} />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                        <button
                            onClick={fetchProjectMaps}
                            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-semibold animate-pulse">Loading project maps...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-5 px-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                                <Server className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Backend Connection Failed</h3>
                                <p className="text-slate-500 font-medium mt-2">Start the admin backend on port 8000 and refresh this page.</p>
                            </div>
                        </div>
                    ) : filteredProjectMaps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-60">
                            <BookOpen className="w-14 h-14 text-slate-400" />
                            <p className="text-slate-500 font-bold">No project maps found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredProjectMaps.map((map) => {
                                const isExpanded = expandedCourses.has(map.courseKey);
                                const projectCount = (map.levels || []).reduce((sum, level) => sum + (level.projects?.length || 0), 0);

                                return (
                                    <section key={map.courseKey} className="group">
                                        <button
                                            onClick={() => toggleCourse(map.courseKey)}
                                            className="w-full px-8 py-6 flex items-start justify-between gap-5 text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex gap-4 min-w-0">
                                                <div className="mt-1 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="text-lg font-black text-slate-800">{map.courseName}</h2>
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                                                            {map.courseKey}
                                                        </span>
                                                        {map.courseId ? (
                                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                                                                linked
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
                                                                course key only
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-500 mt-1">{map.fieldName || "No field assigned"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <Metric label="Levels" value={map.levels?.length || 0} />
                                                <Metric label="Projects" value={projectCount} />
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-8 pb-8">
                                                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                                                    {[...(map.levels || [])]
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((level) => (
                                                            <LevelPanel key={level.key} level={level} />
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
            <div className="text-2xl font-black text-slate-900">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{label}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const Metric = ({ label, value }) => (
    <div className="hidden sm:block text-center min-w-20">
        <div className="text-lg font-black text-slate-800">{value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
);

const LevelPanel = ({ level }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Level {level.order}</span>
                <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase">
                    {level.key}
                </span>
            </div>
            <h3 className="text-sm font-black text-slate-800 mt-2">{level.label}</h3>
        </div>
        <div className="p-4 space-y-3">
            {(level.projects || []).map((project) => (
                <article key={project.sourceId} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-black text-slate-800 leading-snug">{project.title}</h4>
                        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed line-clamp-3">
                        {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {(project.tags || []).slice(0, 4).map((tag) => (
                            <span key={tag} className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                {tag}
                            </span>
                        ))}
                    </div>
                </article>
            ))}
        </div>
    </div>
);

export default ProjectManagement;
