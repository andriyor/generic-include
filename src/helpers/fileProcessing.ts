import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'

import { globSync } from 'glob'

interface IncludesInfo {
  includeLine: string
  relativePath: string
}

export interface FileInfo {
  filePath: string
  content: string
  includes: IncludesInfo[]
}

function trimQuotes(str: string) {
  return str.slice(1, -1)
}

export function cleanupBuildFiles() {
  const buildFiles = globSync('test/project/**/*.build.*')
  buildFiles.forEach(file => fs.rmSync(file))
}

export function getIncludes(filePath: string) {
  const allFileContents = fs.readFileSync(filePath, 'utf-8')
  const includes: IncludesInfo[] = []
  allFileContents.split(/\r?\n/).forEach((includeLine) => {
    if (includeLine.includes('#include')) {
      const [_, includePath] = includeLine.split(' ')
      const pathWithoutQuotes = trimQuotes(includePath.trim())
      const relativePath = path.relative(
        process.cwd(),
        path.resolve(path.dirname(filePath), pathWithoutQuotes),
      )
      if (fs.existsSync(relativePath)) {
        includes.push({
          includeLine,
          relativePath,
        })
      }
    }
  })
  return includes
}

export function getFilesWithMetadata(glob: string) {
  const matched = globSync(glob)
  const filesPath = matched.filter(path => !fs.lstatSync(path).isDirectory())
  const filesInfo: FileInfo[] = []
  for (const filePath of filesPath) {
    const includes = getIncludes(filePath)
    const content = fs.readFileSync(filePath, 'utf-8')
    filesInfo.push({
      filePath,
      includes,
      content,
    })
  }
  return filesInfo
}
