import fs from "fs";
import path from "path";

import {globSync} from "glob";

type IncludesInfo = {
    includeLine: string
    relativePath: string
}

export type FileInfo  = {
    filePath: string,
    content: string,
    includes: IncludesInfo[]
}


const trimQuotes = (str: string) => {
    return str.slice(1, -1);
};

export const cleanupBuildFiles = () => {
    const buildFiles = globSync('test/project/**/*.build.*');
    buildFiles.forEach(file => fs.rmSync(file));
}

export const getIncludes = (filePath: string) => {
    const allFileContents = fs.readFileSync(filePath, 'utf-8');
    const includes: IncludesInfo[] = [];
    allFileContents.split(/\r?\n/).forEach(includeLine => {
        if (includeLine.includes('#include')) {
            const [includeKey, includePath] = includeLine.split(' ');
            const pathWithoutQuotes = trimQuotes(includePath.trim());
            const relativePath = path.relative(
                process.cwd(),
                path.resolve(path.dirname(filePath), pathWithoutQuotes)
            );
            if (fs.existsSync(relativePath)) {
                includes.push({
                    includeLine,
                    relativePath
                })
            }
        }
    });
    return includes;
}

export const getFilesWithMetadata = (glob: string) => {
    const matched = globSync(glob);
    const filesPath = matched.filter(path => !fs.lstatSync(path).isDirectory());
    const filesInfo: FileInfo[] = [];
    for (const filePath of filesPath) {
        const includes = getIncludes(filePath);
        const content = fs.readFileSync(filePath, 'utf-8')
        filesInfo.push({
            filePath,
            includes,
            content,
        })
    }
    return filesInfo;
}
