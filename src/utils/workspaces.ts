import { load as parseYaml } from 'js-yaml';
import micromatch from 'micromatch';

export function pathMatchesWorkspaceGlobs(globs: string[], relativePath: string): boolean {
  return !relativePath || micromatch([relativePath], globs).length > 0;
}

export function workspaceGlobsFromPackage(packageContent: string): string[] | null {
  try {
    const packageData = JSON.parse(packageContent);
    if (Array.isArray(packageData?.workspaces)) {
      return packageData.workspaces;
    }
    if (Array.isArray(packageData?.workspaces?.packages)) {
      return packageData.workspaces.packages;
    }
  } catch (error: any) {
    if (error.name !== 'SyntaxError') {
      throw error;
    }
  }

  return null;
}

export function workspaceGlobsFromPnpm(workspaceContent: string): string[] | null {
  try {
    const workspaceData = workspaceContent ? (parseYaml(workspaceContent) as any) : null;
    if (Array.isArray(workspaceData?.packages)) {
      return workspaceData.packages;
    }
  } catch (error: any) {
    if (error.name !== 'YAMLException') {
      throw error;
    }
  }

  return null;
}
