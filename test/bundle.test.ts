import fs from 'fs';

import {describe, it, expect} from 'vitest'

import {bundle, buildTree} from '../src/main';
import {getIncludes} from "../src/helpers/fileProcessing";

describe('generic-include', () => {
    it('getIncludes', () => {
        expect(getIncludes('test/project/package1/next.txt')).toEqual([
            {
                "includeLine": '#include "./nested/deep.txt"',
                "relativePath": "test/project/package1/nested/deep.txt",
            },
            {
                "includeLine": '#include "./long.txt"',
                 "relativePath": "test/project/package1/long.txt",
            }
        ]);
    })

    describe('build-tree', () => {
        it('multiple root', () => {
            const filesInfo = JSON.parse(fs.readFileSync('./test/snapshots/filesWithInfo.snap.json', 'utf-8'));
            const expectedTree = JSON.parse(fs.readFileSync('./test/snapshots/multiTree.snap.json', 'utf-8'));

            expect(buildTree(filesInfo)).toEqual(expectedTree);
        })
    });

    describe('bundle', () => {
        bundle('test/project/**');

        it('package1', () => {
            const expected = fs.readFileSync('test/snapshots/project/package1/main.build.snap.txt', 'utf-8');
            const result = fs.readFileSync('test/project/package1/main.build.txt', 'utf-8')

            expect(result).toEqual(expected);
        })

        it('package2', () => {
            const expected = fs.readFileSync('test/snapshots/project/package2/main.build.snap.txt', 'utf-8');
            const result = fs.readFileSync('test/project/package2/main.build.txt', 'utf-8')

            expect(result).toEqual(expected);
        })
    });
});
