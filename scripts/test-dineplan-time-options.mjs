import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseDineplanTimeOptions as parse } from './lib/dineplan-time-options.mjs';

test('observed supplier field projection matches independent native form options', () => {
  const load = name => JSON.parse(readFileSync(new URL(`../data/evidence/${name}`, import.meta.url), 'utf8'));
  const evidence = load('dineplan-hussar-search-projection.json');
  const native = load('dineplan-hussar-native.json');
  const response = evidence.requests.find(r => r.action === 'ajax_times');
  assert.equal(response.status, 200);
  assert.equal(response.entryCount, response.items.length);
  assert.equal(evidence.date, native.query.date);
  assert.equal(evidence.partySize, native.query.partySize);
  const result = parse(Object.fromEntries(response.items.map(({key, closed, reason}) => [key,{closed,reason}])));
  assert.deepEqual(result.options.filter(o => o.enabled).map(o => o.time), native.enabledTimeOptions);
  assert.deepEqual(result.options.filter(o => !o.enabled).map(o => o.time), native.closedForOnlineBookingOptions);
  assert.equal(result.finalBookabilityVerified, false);
});

test('synthetic mixed options preserve online closure without claiming final availability', () => {
  const r = parse({ '19:00': { closed: true, reason: 'Closed for Online bookings' }, '18:30': { closed: false, reason: '' } });
  assert.deepEqual(r.options, [{time:'18:30',enabled:true,reason:''},{time:'19:00',enabled:false,reason:'Closed for Online bookings'}]);
  assert.equal(r.finalBookabilityVerified, false);
});
test('empty, rejected and malformed responses never mean full', () => {
  for (const value of [null, false, [], {}, 'Forbidden origin', {Error:'denied'}, {'24:00':{closed:false}}, {'12:00':null}]) {
    assert.equal(parse(value).status, 'unknown');
    assert.deepEqual(parse(value).options, []);
  }
});
test('ambiguous flag types and inherited flags cannot produce enabled options', () => {
  for (const closed of [undefined, null, 0, 1, '0', '1', 'false', 'true']) {
    assert.equal(parse({'12:00':{closed}}).status, 'unknown');
  }
  assert.equal(parse({'12:00':Object.create({closed:false})}).status,'unknown');
});
test('mixed valid and corrupt entries invalidate the entire response', () => {
  assert.deepEqual(parse({'12:00':{closed:false}, '12:30':{closed:'false'}}).options, []);
  assert.equal(parse({'12:00':{closed:false,reason:{text:'test'}}}).status,'unknown');
});
test('all disabled options preserve supplier labels and do not infer sold out', () => {
  const result = parse({'12:00':{closed:true,reason:'Closed for Online bookings'}});
  assert.equal(result.status,'options_observed');
  assert.equal(result.options[0].enabled,false);
  assert.equal(result.finalBookabilityVerified,false);
});
