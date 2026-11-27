'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { START, ROUNDS } = require('../scenarios.js');

function fresh() { return { months: START, profitable: false, expanded: false }; }

function playAll(picks) {
  const s = fresh();
  ROUNDS.forEach((r, i) => {
    const res = r.play(picks[i], s);
    s.months = Math.max(0, s.months + res.delta);
  });
  return s;
}

test('every round is well formed', () => {
  assert.equal(START, 6);
  assert.ok(ROUNDS.length >= 6);
  for (const r of ROUNDS) {
    assert.ok(r.title && r.text && r.lesson, r.title);
    for (const k of ['a', 'b']) {
      assert.ok(r[k].label, `${r.title}: option ${k} has a label`);
      assert.ok(r[k].sub, `${r.title}: option ${k} has a subtitle`);
      const res = r.play(k, fresh());
      assert.equal(typeof res.delta, 'number', `${r.title}/${k}: delta is a number`);
      assert.ok(Number.isInteger(res.delta), `${r.title}/${k}: delta is whole months`);
      assert.ok(res.text.length > 20, `${r.title}/${k}: outcome text explains the result`);
    }
  }
});

test('play() never mutates anything but the documented flags', () => {
  for (const r of ROUNDS) {
    for (const k of ['a', 'b']) {
      const s = fresh();
      r.play(k, s);
      assert.deepEqual(Object.keys(s).sort(), ['expanded', 'months', 'profitable']);
    }
  }
});

test('the careful path survives with cash to spare', () => {
  // test MVP, interview, price for profit, experienced sales lead, small customers, decline investor, cut to core
  const s = playAll(['b', 'a', 'b', 'a', 'a', 'b', 'a']);
  assert.ok(s.months >= 8, `expected a strong finish, got ${s.months}`);
});

test('the reckless path goes bankrupt before the shock is over', () => {
  // build everything, survey, undercut, expensive sales lead, big client, take the money, wait it out
  const s = playAll(['a', 'b', 'a', 'a', 'b', 'a', 'b']);
  assert.equal(s.months, 0);
});

test('investor money only hurts when growth was unprofitable', () => {
  const shock = ROUNDS.find((r) => r.title === 'The shock');
  const expandedProfitable = shock.play('b', { months: 9, profitable: true, expanded: true });
  const expandedLossMaking = shock.play('b', { months: 9, profitable: false, expanded: true });
  const small = shock.play('b', { months: 5, profitable: true, expanded: false });
  assert.ok(expandedLossMaking.delta < expandedProfitable.delta);
  assert.ok(expandedProfitable.delta < small.delta);
});

test('cutting back always saves exactly one month in the shock', () => {
  const shock = ROUNDS.find((r) => r.title === 'The shock');
  for (const expanded of [true, false]) {
    for (const profitable of [true, false]) {
      const wait = shock.play('b', { months: 9, profitable, expanded });
      const cut = shock.play('a', { months: 9, profitable, expanded });
      assert.equal(cut.delta - wait.delta, 1);
    }
  }
});

test('an expensive hire pays off only once sales are profitable', () => {
  const hire = ROUNDS.find((r) => r.title === 'The first hire');
  assert.ok(hire.play('a', { months: 6, profitable: true, expanded: false }).delta > 0);
  assert.ok(hire.play('a', { months: 6, profitable: false, expanded: false }).delta < 0);
  assert.equal(hire.play('b', { months: 6, profitable: false, expanded: false }).delta, 0);
});

test('the game is winnable and losable but not trivial', () => {
  const outcomes = new Set();
  const n = ROUNDS.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picks = [];
    for (let i = 0; i < n; i++) picks.push(mask & (1 << i) ? 'b' : 'a');
    outcomes.add(playAll(picks).months);
  }
  assert.ok(outcomes.has(0), 'some path ends in bankruptcy');
  assert.ok([...outcomes].some((m) => m >= 8), 'some path is built to last');
  assert.ok(outcomes.size >= 5, 'different choices lead to different results');
});
