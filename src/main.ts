import fs from "fs";
import util from "util";

import {cleanupBuildFiles, FileInfo, getFilesWithMetadata} from "./helpers/fileProcessing";

type Tree = {
    includeLine?: string,
    name: string,
    content: string,
    children: Tree[]
}

export const buildTree = (data: FileInfo[]) => {
    const tree: Record<string, Tree> = {};

    // Create nodes
    data.forEach(node => {
        const {filePath, content} = node;
        tree[filePath] = { content, name: filePath, children: [] };
    });

    // Create edges
    data.forEach(item => {
        const { filePath, includes } = item;
        includes.forEach(include => {
            tree[filePath].children.push({
                includeLine: include.includeLine,
                ...tree[include.relativePath]
            });
        });
    });

    // Find root nodes
    const rootNodes = data.filter(node => {
        return !data.some(edge => edge.includes.some(n => n.relativePath === node.filePath));
    });

    const rootNode: Tree = { name: 'Root', children: [], content: '' };
    rootNodes.forEach(node => {
        rootNode.children.push(tree[node.filePath]);
    });
    return rootNode;
}

const traverseAndBundleTree = (node: Tree) => {
    if (node.children.length) {
        for (const child of node.children) {
            traverseAndBundleTree(child);
            if (node.name !== 'Root') {
                node.content = node.content.replace(`${child.includeLine}\n`, child.content);
            }
        }
    }
}

const createSnapshot = (result: {filesWithInfo: FileInfo, processedTree: Tree, unprocessedTree: Tree}) => {
    console.log('tree');
    console.log(util.inspect(result.unprocessedTree, false, null, true))
    fs.writeFileSync('./test/snapshots/multiTree.snap.json',JSON.stringify(result.unprocessedTree, null, 2), 'utf-8')

    console.log('filesWithInfo');
    console.log(util.inspect(result.filesWithInfo, false, null, true))
    fs.writeFileSync('./test/snapshots/filesWithInfo.snap.json',JSON.stringify(result.filesWithInfo, null, 2), 'utf-8')
}


export const bundle = (glob: string) => {
    cleanupBuildFiles();

    const filesWithInfo = getFilesWithMetadata(glob);
    const tree = buildTree(filesWithInfo);

    const unprocessedTree = JSON.parse(JSON.stringify(tree));

    traverseAndBundleTree(tree);

    for (const children of tree.children) {
        fs.writeFileSync(children.name.replace('.', '.build.'), children.content, 'utf-8')
    }

    return {
        filesWithInfo,
        unprocessedTree,
        processedTree: tree
    }
}

// const result = bundle('test/project/**');

// createSnapshot(result)
