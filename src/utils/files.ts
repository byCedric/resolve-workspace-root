import fs from 'node:fs';

export function tryReadFile(file: string): string | null {
  try {
    return fs.readFileSync(file, { encoding: 'utf-8' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export function tryReadFileAsync(file: string): Promise<string | null> {
  return fs.promises.readFile(file, { encoding: 'utf-8' }).catch((error: any) => {
    if ('code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  });
}
