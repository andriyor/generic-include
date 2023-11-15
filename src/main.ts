import path from "path";
import fs from "fs";
import util from "util";

import {globSync} from 'glob'


const trimQuotes = (str: string) => {
    return str.slice(1, -1);
};

type TreeItem = {
    includeLine: string,
    name: string,
    content: string,
    children: TreeItem[]
}

export const buildTree = (data: Graph) => {
    const tree: Record<string, TreeItem> = {};

    // Create nodes
    Object.keys(data.nodes).forEach(nodeKey => {
        tree[nodeKey] = { content: data.nodes[nodeKey].content, name: nodeKey, children: [] };
    });

    // Create edges
    data.edges.forEach(edge => {
        const { child, parent, includeLine, content } = edge;
        tree[parent].children.push({
            includeLine: includeLine,
            content: content,
            ...tree[child],
        });
    });

    // Find root node(s)
    const rootNodes = Object.keys(data.nodes).filter(node => {
        return !data.edges.some(edge => edge.child === node);
    });

    const rootNode = { name: 'Root', children: [] };
    rootNodes.forEach(node => {
        rootNode.children.push(tree[node]);
    });
    return rootNode;
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

type IncludesInfo = {
    line: string
    relativePath: string
}


export const getIncludes = (filePath: string) => {
    const allFileContents = fs.readFileSync(filePath, 'utf-8');
    const includes: IncludesInfo[] = [];
    allFileContents.split(/\r?\n/).forEach(line => {
        if (line.includes('#include')) {
            const [include, includePath] = line.split(' ');
            const pathWithoutQuotes = trimQuotes(includePath.trim());
            const relativePath = path.relative(
                process.cwd(),
                path.resolve(path.dirname(filePath), pathWithoutQuotes)
            );
            if (fs.existsSync(relativePath)) {
                includes.push({
                    line,
                    relativePath
                })
            }
        }
    });
    return includes;
}

type FileInfo  = {
    filePath: string,
    content: string,
    includes: IncludesInfo[]
}

function traverseFromBottomUp(node: TreeItem) {
    if (node.children.length) {
        for (const child of node.children) {
            traverseFromBottomUp(child);
            if (node.name !== 'Root') {
                node.content = node.content.replace(`${child.includeLine}\n`, child.content);
            }
        }
    }
}

export const bundle = (glob: string) => {
    const buildFiles = globSync('test/project/**/*.build.*');
    buildFiles.forEach(file => fs.rmSync(file));

    const matched = globSync(glob);
    const filesPath = matched.filter(path => !fs.lstatSync(path).isDirectory());
    const res: FileInfo[] = [];
    for (const filePath of filesPath) {
        res.push({
            filePath,
            includes: getIncludes(filePath),
            content: fs.readFileSync(filePath, 'utf-8')
        })
    }

    const graph = buildGraph(res);
    console.log('graph');
    fs.writeFileSync('./test/snapshots/multiGraph.snap.json',JSON.stringify(graph, null, 4), 'utf-8')
    console.log(util.inspect(graph, false, null, true))
    const tree = buildTree(graph);
    console.log('tree');
    fs.writeFileSync('./test/snapshots/multiTree.snap.json',JSON.stringify(tree, null, 4), 'utf-8')
    console.log(util.inspect(tree, false, null, true))
    traverseFromBottomUp(tree);
    console.log(util.inspect(tree, false, null, true))

    for (const children of tree.children) {
        fs.writeFileSync(children.name.replace('.', '.build.'), children.content, 'utf-8')
    }
}

bundle('test/project/**');
