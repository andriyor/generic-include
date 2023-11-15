import fs from 'fs';

import {describe, it, expect} from 'vitest'

import {bundle, buildTree} from '../src/main';

describe('generic-include', () => {
    describe('build-tree', () => {
        it('single root', () => {
            const graph = JSON.parse(fs.readFileSync('./test/graph.snap.json', 'utf-8'));
            const expectedTree = JSON.parse(fs.readFileSync('./test/tree.snap.json', 'utf-8'));

            expect(buildTree(graph)).toEqual(expectedTree);
        })

        it('multiple root', () => {
            const graph = JSON.parse(fs.readFileSync('./test/multiGraph.snap.json', 'utf-8'));
            const expectedTree = JSON.parse(fs.readFileSync('./test/multiTree.snap.json', 'utf-8'));

            expect(buildTree(graph)).toEqual(expectedTree);
        })
    });

    it('bundle', () => {
        bundle('test/project/**', 'test/result.txt');
        const expected = fs.readFileSync('test/result.snap.txt', 'utf-8');
        const result = fs.readFileSync('test/result.txt', 'utf-8')

        expect(result).toEqual(expected);
    });
});
