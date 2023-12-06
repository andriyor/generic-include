import * as util from 'node:util'
import * as fs from 'node:fs'

import type { FileInfo } from '../../src/helpers/fileProcessing'
import type { Tree } from '../../src/main'

export function createSnapshot(result: { filesWithInfo: FileInfo, processedTree: Tree, unprocessedTree: Tree }) {
  console.log('tree')
  console.log(util.inspect(result.unprocessedTree, false, null, true))
  fs.writeFileSync('./test/snapshots/multiTree.snap.json', JSON.stringify(result.unprocessedTree, null, 2), 'utf-8')

  console.log('filesWithInfo')
  console.log(util.inspect(result.filesWithInfo, false, null, true))
  fs.writeFileSync('./test/snapshots/filesWithInfo.snap.json', JSON.stringify(result.filesWithInfo, null, 2), 'utf-8')
}
