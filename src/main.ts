import * as fs from 'node:fs'

import { typeFlag } from 'type-flag'

import type { FileInfo } from './helpers/fileProcessing'
import { cleanupBuildFiles, getFilesWithMetadata } from './helpers/fileProcessing'

const parsed = typeFlag({
  filesGlob: {
    type: String,
    alias: 'f',
  },
})

export interface Tree {
  includeLine?: string
  name: string
  content: string
  children: Tree[]
}

export function buildTree(data: FileInfo[]) {
  const tree: Record<string, Tree> = {}

  // Create nodes
  data.forEach((node) => {
    const { filePath, content } = node
    tree[filePath] = { content, name: filePath, children: [] }
  })

  // Create edges
  data.forEach((item) => {
    const { filePath, includes } = item
    includes.forEach((include) => {
      tree[filePath].children.push({
        includeLine: include.includeLine,
        ...tree[include.relativePath],
      })
    })
  })

  // Find root nodes
  const rootNodes = data.filter((node) => {
    return !data.some(edge => edge.includes.some(n => n.relativePath === node.filePath))
  })

  const rootNode: Tree = { name: 'Root', children: [], content: '' }
  rootNodes.forEach((node) => {
    rootNode.children.push(tree[node.filePath])
  })
  return rootNode
}

function traverseAndBundleTree(node: Tree) {
  if (node.children.length) {
    for (const child of node.children) {
      traverseAndBundleTree(child)
      if (node.name !== 'Root') {
        node.content = node.content.replace(`${child.includeLine}\n`, child.content)
      }
    }
  }
}

export function bundle(glob: string) {
  cleanupBuildFiles()

  const filesWithInfo = getFilesWithMetadata(glob)
  const tree = buildTree(filesWithInfo)

  const unprocessedTree = JSON.parse(JSON.stringify(tree))

  traverseAndBundleTree(tree)

  for (const children of tree.children) {
    fs.writeFileSync(children.name.replace('.', '.build.'), children.content, 'utf-8')
  }

  return {
    filesWithInfo,
    unprocessedTree,
    processedTree: tree,
  }
}

if (parsed.flags.filesGlob) {
  bundle(parsed.flags.filesGlob)
}
else {
  console.log('provide --files-glob option')
}
