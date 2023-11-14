import fs from 'fs';

import { describe, it, expect } from 'vitest'

import { bundle } from '../src/main';

describe('generic-include', () => {
  it('bundle', () => {
      bundle('test/project/**', 'test/result.txt');
      expect(fs.readFileSync('test/result.snap.txt', 'utf-8')).equals(fs.readFileSync('test/result.txt', 'utf-8'));
  })
});
