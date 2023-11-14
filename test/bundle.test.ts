import fs from 'fs';

import { describe, it, expect } from 'vitest'

import { bundle } from '../src/main';

describe('generic-include', () => {
  it('bundle', () => {
      bundle('test/project/**', 'test/result.txt');
      expect(fs.readFileSync('test/result.snap.txt', 'utf-8')).equals('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n' +
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n' +
          'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
          'lol\n' +
          '\n' +
          '\n' +
          'long\n' +
          '\n' +
          '\n' +
          'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n');
  })
});
