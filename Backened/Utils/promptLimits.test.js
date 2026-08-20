import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptBatches, prepareTranscriptChunks, splitTextIntoBatches } from './promptLimits.js';

test('prepareTranscriptChunks keeps transcript chunks intact', () => {
  const chunks = Array.from({ length: 3 }, (_, index) => ({
    start: `00:00:${String(index).padStart(2, '0')}`,
    end: `00:00:${String(index + 1).padStart(2, '0')}`,
    text: `Chunk ${index}`,
  }));

  const result = prepareTranscriptChunks(chunks);

  assert.equal(result.length, 3);
  assert.equal(result[0].text, 'Chunk 0');
});

test('buildPromptBatches splits large transcript chunk lists into smaller prompt-safe batches', () => {
  const chunks = Array.from({ length: 6 }, (_, index) => ({
    start: `00:00:${String(index).padStart(2, '0')}`,
    end: `00:00:${String(index + 1).padStart(2, '0')}`,
    text: `Chunk ${index} ${'x'.repeat(400)}`,
  }));

  const batches = buildPromptBatches(chunks, { maxCharsPerBatch: 900, maxChunksPerBatch: 3 });

  assert.ok(batches.length > 1);
  assert.ok(batches.every((batch) => batch.length <= 3));
});

test('splitTextIntoBatches splits long text into smaller text batches', () => {
  const text = 'Hello world. '.repeat(80);
  const batches = splitTextIntoBatches(text, { maxCharsPerBatch: 300 });

  assert.ok(batches.length > 1);
  assert.ok(batches.every((batch) => batch.length <= 300));
});
