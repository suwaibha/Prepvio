import test from 'node:test';
import assert from 'node:assert/strict';
import { getTranscript } from './transcript.js';

test('parses plain text transcript input into items', async () => {
  const items = await getTranscript('Hola mundo\nEste es un ejemplo');

  assert.equal(items.length, 2);
  assert.equal(items[0].text, 'Hola mundo');
  assert.equal(items[0].offset, 0);
});
