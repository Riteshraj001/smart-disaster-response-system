import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchEmergencyRoute } from '../src/utils/routing.js';

test('returns real OSRM road geometry and duration', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    routes: [{
      distance: 1234.6,
      duration: 321.4,
      geometry: { coordinates: [[77.20, 28.60], [77.21, 28.61]] },
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    const route = await fetchEmergencyRoute([28.60, 77.20], [28.61, 77.21]);
    assert.deepEqual(route.coordinates, [[28.60, 77.20], [28.61, 77.21]]);
    assert.equal(route.distanceMeters, 1235);
    assert.equal(route.durationSeconds, 321);
    assert.equal(route.isRoadRoute, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns no ETA data when OSRM is unavailable instead of fabricating a fallback', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });

  try {
    assert.equal(await fetchEmergencyRoute([28.60, 77.20], [28.61, 77.21]), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
