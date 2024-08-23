import fs from 'node:fs';

export function tryReadFile(file: string): string | null {
  try {
    return fs.readFileSync(file, { encoding: 'utf-8' });
  } catch (error: any) {
    if (shouldIgnoreError(error)) {
      return null;
    }

    throw error;
  }
}

export function tryReadFileAsync(file: string): Promise<string | null> {
  return fs.promises.readFile(file, { encoding: 'utf-8' }).catch((error: any) => {
    if (shouldIgnoreError(error)) {
      return null;
    }

    throw error;
  });
}

/**
 * We are optimistically reading files, avoiding unnecessary file lookup checks.
 * Some thrown errors are expected and should be ignored as "file not found".
 */
function shouldIgnoreError(error: any): error is Error {
  return 'code' in error && (error.code === 'ENOENT' || error.code === 'EISDIR');
}
