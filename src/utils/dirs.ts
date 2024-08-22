import path from 'node:path';
import process from 'node:process';

export function searchParentDirs<T>(
  startingDir = process.cwd(),
  searchAction: (currentDir: string, relativeDir: string) => T
) {
  let currentDir = path.normalize(startingDir);
  let previousDir: string;

  do {
    const result = searchAction(currentDir, path.relative(currentDir, startingDir));
    if (result !== undefined) {
      return result;
    }

    previousDir = currentDir;
    currentDir = path.dirname(currentDir);
  } while (currentDir !== previousDir);

  return null;
}

export async function searchParentDirsAsync<T>(
  startingDir: string,
  searchAction: (currentDir: string, relativeDir: string) => Promise<T>
) {
  let currentDir = path.normalize(startingDir);
  let previousDir: string;

  do {
    const result = await searchAction(currentDir, path.relative(currentDir, startingDir));
    if (result !== undefined) {
      return result;
    }

    previousDir = currentDir;
    currentDir = path.dirname(currentDir);
  } while (currentDir !== previousDir);

  return null;
}
