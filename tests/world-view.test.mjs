import test from 'node:test';
import assert from 'node:assert/strict';
import {worldLod} from '../public/world-view.js';

test('zoomed-out exploration requests lightweight map sectors',()=>{
 assert.equal(worldLod(1.45),0);
 assert.equal(worldLod(.79),0);
 assert.equal(worldLod(.78),1);
 assert.equal(worldLod(.55),1);
});
