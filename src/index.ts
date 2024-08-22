import path from 'node:path';
import process from 'node:process';

import { searchParentDirs, searchParentDirsAsync } from './utils/dirs';
import { tryReadFile, tryReadFileAsync } from './utils/files';
import {
  pathMatchesWorkspaceGlobs,
  workspaceGlobsFromPackage,
  workspaceGlobsFromPnpm,
} from './utils/workspaces';

type ResolveWorkspaceOptions = Partial<{
  packageWorkspaces: boolean;
  pnpmWorkspaces: boolean;
}>;

/**
 * Resolve the root of the workspace, using bun, npm, pnpm, or yarn.
 * This will iterate the parent directories until it finds a workspace config,
 * where the starting directory is considered part of the workspace.
 *   - For bun and npm - it looks for the [`workspaces` list](https://docs.npmjs.com/cli/configuring-npm/package-json#workspaces) in `package.json`
 *   - For yarn - it looks for the [`workspaces` list or config](https://yarnpkg.com/features/workspaces) in `package.json`
 *   - For pnpm - it looks for the [`pnpm-workspace.yaml`](https://pnpm.io/workspaces) file
 */
export function resolveWorkspaceRoot(
  startingDir = process.cwd(),
  options: ResolveWorkspaceOptions = {}
): string | null {
  return searchParentDirs(startingDir, (currentDir, relativeDir) => {
    let packageContent: string | null = null;

    if (options.packageWorkspaces !== false) {
      packageContent = tryReadFile(path.join(currentDir, 'package.json'));
      const packageGlobs = packageContent && workspaceGlobsFromPackage(packageContent);
      if (packageGlobs && pathMatchesWorkspaceGlobs(packageGlobs, relativeDir)) {
        return currentDir;
      }
    }

    if (options.pnpmWorkspaces !== false && packageContent) {
      const workspaceContent = tryReadFile(path.join(currentDir, 'pnpm-workspace.yaml'));
      const workspaceGlobs = workspaceContent && workspaceGlobsFromPnpm(workspaceContent);
      if (workspaceGlobs && pathMatchesWorkspaceGlobs(workspaceGlobs, relativeDir)) {
        return currentDir;
      }
    }
  });
}

/**
 * Resolve the root of the workspace, using bun, npm, pnpm, or yarn.
 * This will iterate the parent directories until it finds a workspace config,
 * where the starting directory is considered part of the workspace.
 *   - For bun and npm - it looks for the [`workspaces` list](https://docs.npmjs.com/cli/configuring-npm/package-json#workspaces) in `package.json`
 *   - For yarn - it looks for the [`workspaces` list or config](https://yarnpkg.com/features/workspaces) in `package.json`
 *   - For pnpm - it looks for the [`pnpm-workspace.yaml`](https://pnpm.io/workspaces) file
 */
export function resolveWorkspaceRootAsync(
  startingDir = process.cwd(),
  options: ResolveWorkspaceOptions = {}
): Promise<string | null> {
  return searchParentDirsAsync(startingDir, async (currentDir, relativeDir) => {
    let packageContent: string | null = null;

    if (options.packageWorkspaces !== false) {
      packageContent = await tryReadFileAsync(path.join(currentDir, 'package.json'));
      const packageGlobs = packageContent && workspaceGlobsFromPackage(packageContent);
      if (packageGlobs && pathMatchesWorkspaceGlobs(packageGlobs, relativeDir)) {
        return currentDir;
      }
    }

    if (options.pnpmWorkspaces !== false && packageContent) {
      const workspaceContent = await tryReadFileAsync(path.join(currentDir, 'pnpm-workspace.yaml'));
      const workspaceGlobs = workspaceContent && workspaceGlobsFromPnpm(workspaceContent);
      if (workspaceGlobs && pathMatchesWorkspaceGlobs(workspaceGlobs, relativeDir)) {
        return currentDir;
      }
    }
  });
}
