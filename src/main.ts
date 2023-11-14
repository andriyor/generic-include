import path from "path";
import {globSync} from 'glob'

import fs from "fs";

import util from "util";

const trimQuotes = (str: string) => {
    return str.slice(1, -1);
};

type TreeItem = {
    includeLine: string,
    name: string,
    content: string,
    children: TreeItem[]
}

function buildTree(data: Graph) {
    const tree: Record<string, TreeItem> = {};

    // Create nodes
    data.nodes.forEach(node => {
        tree[node] = { name: node, children: [] };
    });

    // Create edges
    data.edges.forEach(edge => {
        const { child, parent, includeLine, content } = edge;
        tree[parent].children.push({
            includeLine: includeLine,
            content: fs.readFileSync(tree[child].name, 'utf-8'),
            ...tree[child],
        });
    });

    // Find root node(s)
    const rootNodes = data.nodes.filter(node => {
        return !data.edges.some(edge => edge.child === node);
    });

    // Handle multiple root nodes if present
    if (rootNodes.length === 1) {
        return tree[rootNodes[0]];
    } else {
        const rootNode = { name: 'Root', children: [] };
        rootNodes.forEach(node => {
            rootNode.children.push(tree[node]);
        });
        return rootNode;
    }
}

type Graph = {
    edges: {
        child: string
        parent: string
        content: string
        includeLine: string
    }[]
    nodes: string[]
}


const buildGraph = (res: FileInfo[]) => {
    const graph: Graph = {
        edges: [],
        nodes: []
    };
    for (const resItem of res) {
        graph.nodes.push(resItem.filePath)
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


const getIncludes = (filePath: string) => {
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
            if (node.content === undefined) {
                node.content = fs.readFileSync(node.name, 'utf-8').replace(child.includeLine, child.content);
            } else {
                node.content = node.content.replace(child.includeLine, child.content);
            }
        }
    }
}

export const bundle = (glob: string, outputFile: string) => {
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

    const tree = buildTree(buildGraph(res))
    console.log('tree');
    console.log(util.inspect(tree, false, null, true))
    traverseFromBottomUp(tree);
    console.log(util.inspect(tree, false, null, true))
    fs.writeFileSync(outputFile, tree.content, 'utf-8')
}

bundle('test/project/**', 'result.txt');
