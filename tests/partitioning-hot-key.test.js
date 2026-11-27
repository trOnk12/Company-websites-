'use strict';

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const script = path.join(__dirname, '..', 'labs', 'partitioning', 'hot_key.py');

function run(...args) {
  return execFileSync('python3', [script, ...args], { encoding: 'utf8' }).trim().split('\n');
}

test('a hot lot stays on one owner while request routing only looks balanced', () => {
  expect(run()).toEqual([
    'by_lot busiest_owner=0 requests=700 overload=600',
    'by_request busiest_requests=63',
    'unsafe_last_space_grants=2',
  ]);
});

test('adding owners does not split an equal lot key', () => {
  expect(run('--owners', '32')).toEqual([
    'by_lot busiest_owner=0 requests=700 overload=600',
    'by_request busiest_requests=32',
    'unsafe_last_space_grants=2',
  ]);
});

test('changing the west workload removes its overload', () => {
  expect(run('--west', '100')).toEqual([
    'by_lot busiest_owner=0 requests=100 overload=0',
    'by_request busiest_requests=63',
    'unsafe_last_space_grants=2',
  ]);
});
