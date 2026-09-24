import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ABILITIES } from '../public/data.js';

test('grant de teste contém exatamente todos os golpes equipáveis', async () => {
  const sql = await readFile(new URL('../supabase/grant-guigtx01-all-moves-20260924.sql', import.meta.url), 'utf8');
  const match = sql.match(/select user_id, 'qa-guigtx01-all-moves-20260924', '(.+)'::jsonb/);
  assert.ok(match, 'specimen do grant não encontrado');
  const specimen = JSON.parse(match[1].replaceAll("''", "'"));
  const expected = Object.keys(ABILITIES).filter(id => id !== 'basic');
  assert.deepEqual(new Set(specimen.knownMoves), new Set(expected));
  assert.equal(specimen.knownMoves.length, expected.length);
  assert.equal(specimen.moveLoadoutVersion, 2);
  assert.equal(specimen.level, 100);
  assert.deepEqual(specimen.slots, ['earthquake', 'surf', 'muddyWater', 'flamethrower']);
});
