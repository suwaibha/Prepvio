export function prepareTranscriptChunks(chunks) {
  if (!Array.isArray(chunks) || !chunks.length) {
    return [];
  }

  return chunks.map((chunk) => ({
    ...chunk,
    text: typeof chunk?.text === 'string' ? chunk.text : '',
  }));
}

export function buildPromptBatches(chunks, options = {}) {
  const maxChunksPerBatch = options.maxChunksPerBatch ?? 3;
  const maxCharsPerBatch = options.maxCharsPerBatch ?? 1200;

  if (!Array.isArray(chunks) || !chunks.length) {
    return [];
  }

  const batches = [];
  let currentBatch = [];
  let currentChars = 0;

  for (const chunk of chunks) {
    const chunkText = typeof chunk?.text === 'string' ? chunk.text : '';
    const nextChunkChars = currentChars + chunkText.length + 50;

    if (
      currentBatch.length >= maxChunksPerBatch ||
      (currentBatch.length > 0 && nextChunkChars > maxCharsPerBatch)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(chunk);
    currentChars += chunkText.length + 50;
  }

  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  return batches;
}

export function splitTextIntoBatches(text, options = {}) {
  const maxCharsPerBatch = options.maxCharsPerBatch ?? 1200;
  const source = String(text || '');

  if (!source) {
    return [];
  }

  const batches = [];
  let start = 0;

  while (start < source.length) {
    const end = Math.min(start + maxCharsPerBatch, source.length);
    batches.push(source.slice(start, end));
    start = end;
  }

  return batches;
}
