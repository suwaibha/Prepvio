/**
 * Deduplicates course progress entries for a user.
 * Keeps the entry with the most progress for each unique courseId and channelId.
 * @param {Array} courseProgress - The array of course progress objects.
 * @returns {Array} - The deduplicated array of course progress objects.
 */
export const deduplicateCourseProgress = (courseProgress) => {
    if (!courseProgress || !Array.isArray(courseProgress)) return [];

    const courseMap = new Map();

    courseProgress.forEach((course) => {
        const key = `${course.courseId}-${course.channelId}`;
        const existing = courseMap.get(key);

        if (!existing || (course.watchedSeconds || 0) > (existing.watchedSeconds || 0)) {
            courseMap.set(key, course);
        }
    });

    return Array.from(courseMap.values());
};
