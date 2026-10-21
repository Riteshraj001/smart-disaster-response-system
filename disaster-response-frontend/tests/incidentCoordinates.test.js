import test from 'node:test';
import assert from 'node:assert/strict';

import { getIncidentCoordinates, parseLocationCoordinates } from '../src/utils/incidentCoordinates.js';

test('prefers direct latitude and longitude fields when available', () => {
  const incident = {
    id: 42,
    latitude: 12.84432,
    longitude: 80.15202,
    location: 'Block A',
  };

  assert.deepStrictEqual(getIncidentCoordinates(incident), [12.84432, 80.15202]);
});

test('parses latitude and longitude from a labelled location string', () => {
  const incident = {
    id: 43,
    location: 'Lat: 12.84432, Long: 80.15202',
  };

  assert.deepStrictEqual(getIncidentCoordinates(incident), [12.84432, 80.15202]);
});

test('parses coordinates enclosed in parentheses', () => {
  const incident = {
    id: 44,
    location: 'AB3 (12.843739, 80.155236)',
  };

  assert.deepStrictEqual(getIncidentCoordinates(incident), [12.843739, 80.155236]);
});

test('returns null for plain-text locations without coordinates', () => {
  assert.equal(parseLocationCoordinates('Block A'), null);
  assert.equal(getIncidentCoordinates({ id: 45, location: 'Block A' }), null);
});

test('rejects invalid latitude and longitude ranges', () => {
  assert.equal(parseLocationCoordinates('Lat: 99, Long: 181'), null);
  assert.equal(parseLocationCoordinates('Lat: -91, Long: 80'), null);
  assert.equal(parseLocationCoordinates('AB3 (12.843739, 200.0)'), null);
});
