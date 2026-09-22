import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server.mjs';
test('serves only public files and rejects write requests', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const index = await fetch(origin); assert.equal(index.status, 200); assert.match(await index.text(), /VERDANT/);
    const js = await fetch(origin + '/simulation.js'); assert.match(js.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(origin + '/package.json')).status, 404);
    assert.equal((await fetch(origin + '/%2e%2e%5cpackage.json')).status, 403);
    assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
