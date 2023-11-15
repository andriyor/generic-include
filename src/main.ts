import fs from "fs";
import util from "util";

import {cleanupBuildFiles, FileInfo, getFilesWithMetadata} from "./helpers/fileProcessing";

type Tree = {
    includeLine?: string,
    name: string,
    content: string,
    children: Tree[]
}

type Graph = {
    edges: {
        child: string
        parent: string
        content: string
        includeLine: string
    }[]
    nodes: Record<string, {
        name: string
        content: string
    }>
}

export const buildTree = (data: Graph) => {
    const tree: Record<string, Tree> = {};

    // Create nodes
    Object.keys(data.nodes).forEach(nodeKey => {
        tree[nodeKey] = { content: data.nodes[nodeKey].content, name: nodeKey, children: [] };
    });

    // Create edges
    data.edges.forEach(edge => {
        const { child, parent, includeLine, content } = edge;
        tree[parent].children.push({
            includeLine: includeLine,
            ...tree[child],
        });
    });

    // Find root nodes
    const rootNodes = Object.keys(data.nodes).filter(node => {
        return !data.edges.some(edge => edge.child === node);
    });

    const rootNode: Tree = { name: 'Root', children: [], content: '' };
    rootNodes.forEach(node => {
        rootNode.children.push(tree[node]);
    });
    return rootNode;
}



const buildGraph = (res: FileInfo[]) => {
    const graph: Graph = {
        edges: [],
        nodes: {}
    };
    for (const resItem of res) {
        graph.nodes[resItem.filePath] = {
            name: resItem.filePath,
            content: resItem.content,
        }
        for (const resKeyElement of resItem.includes) {
            graph.edges.push({
                child: resKeyElement.relativePath,
                parent: resItem.filePath,
                content: resItem.content,
                includeLine: resKeyElement.line
            })
        }
    }
    return graph;
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

const createSnapshot = (result: {graph: Graph, processedTree: Tree, unprocessedTree: Tree}) => {
    console.log('graph');
    fs.writeFileSync('./test/snapshots/multiGraph.snap.json',JSON.stringify(result.graph, null, 4), 'utf-8')
    console.log(util.inspect(result.graph, false, null, true))

    console.log('tree');
    fs.writeFileSync('./test/snapshots/multiTree.snap.json',JSON.stringify(result.unprocessedTree, null, 4), 'utf-8')
    console.log(util.inspect(result.unprocessedTree, false, null, true))
}


export const bundle = (glob: string) => {
    cleanupBuildFiles();

    const filesWithInfo = getFilesWithMetadata(glob);
    const graph = buildGraph(filesWithInfo);
    const tree = buildTree(graph);

    const unprocessedTree = JSON.parse(JSON.stringify(tree));

    traverseAndBundleTree(tree);

    for (const children of tree.children) {
        fs.writeFileSync(children.name.replace('.', '.build.'), children.content, 'utf-8')
    }

    return {
        graph,
        unprocessedTree,
        processedTree: tree
    }
}

const result = bundle('test/project/**');

createSnapshot(result)
