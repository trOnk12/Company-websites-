'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test, expect } = require('@playwright/test');

test('the Linux open-file drill proves the unlink and close boundaries', () => {
  const script = path.join(__dirname, '..', 'labs', 'linux-open-file', 'open_deleted.py');
  const output = execFileSync('python3', [script], { encoding: 'utf8' });

  expect(output).toContain('pathname: missing');
  expect(output).toContain('descriptor target:');
  expect(output).toContain('(deleted)');
  expect(output).toContain('descriptor bytes: 4194304');
  expect(output).toContain('hard links: 0');
  expect(output).toContain('descriptor entry: missing');
  expect(output).toContain('verified: the failure and release boundary behaved as predicted');
});
