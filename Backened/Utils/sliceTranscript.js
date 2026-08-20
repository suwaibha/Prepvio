/**
 * Converts HH:MM:SS to milliseconds
 */
function timeToMs(time) {
  const [hours, minutes, seconds] = time.split(":").map(Number);

  return (
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000 +
    seconds * 1000
  );
}

/**
 * Extract transcript for a given topic.
 *
 * @param {Array} transcript Original transcript
 * @param {Object} topic
 * @returns {Object}
 */
export function sliceTranscript(transcript, topic) {
  const startMs = timeToMs(topic.start);
  const endMs = timeToMs(topic.end);

  const filtered = transcript.filter((item) => {
    return item.offset >= startMs && item.offset < endMs;
  });

  return {
    topic: topic.topic,
    start: topic.start,
    end: topic.end,
    transcript: filtered.map((item) => item.text).join(" "),
  };
}

/**
 * Slice transcript for all detected topics.
 *
 * @param {Array} transcript
 * @param {Array} topics
 * @returns {Array}
 */
export function sliceAllTopics(transcript, topics) {
  return topics.map((topic) => sliceTranscript(transcript, topic));
}