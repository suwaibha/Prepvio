export function chunkTranscriptByMinutes(transcript, minutes = 5) {
  const chunkDurationMs = minutes * 60 * 1000;
  const chunks = [];

  if (!Array.isArray(transcript) || !transcript.length) {
    return chunks;
  }

  let current = [];
  let currentStart = transcript[0].offset ?? 0;

  for (const item of transcript) {
    const itemOffset = item.offset ?? 0;

    if (current.length && itemOffset - currentStart >= chunkDurationMs) {
      chunks.push(current);
      current = [];
      currentStart = itemOffset;
    }

    current.push(item);
  }

  if (current.length) {
    chunks.push(current);
  }

  return chunks;
}
