function msToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
    )}:${String(seconds).padStart(2, "0")}`;
}

export function mergeTranscript(transcript, chunkDuration = 60000) {
    if (!transcript.length) return [];

    const chunks = [];

    let current = {
        start: transcript[0].offset,
        end: transcript[0].offset + transcript[0].duration,
        text: transcript[0].text,
    };

    for (let i = 1; i < transcript.length; i++) {
        const item = transcript[i];

        if (item.offset - current.start <= chunkDuration) {
            current.text += " " + item.text;
            current.end = item.offset + item.duration;
        } else {
            chunks.push({
                start: msToTime(current.start),
                end: msToTime(current.end),
                startMs: current.start,
                endMs: current.end,
                text: current.text.trim(),
            });

            current = {
                start: item.offset,
                end: item.offset + item.duration,
                text: item.text,
            };
        }
    }

    chunks.push({
        start: msToTime(current.start),
        end: msToTime(current.end),
        startMs: current.start,
        endMs: current.end,
        text: current.text.trim(),
    });

    return chunks;
}