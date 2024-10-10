import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { dump as stringifyYaml } from 'js-yaml';
import { fs, vol } from 'memfs';

import { resolveWorkspaceRootAsync, getWorkspaceGlobsAsync } from '..';

mock.module('node:fs', () => ({ default: fs }));

beforeEach(() => vol.reset());

describe('bun, npm, yarn', () => {
  describe('workspaces: string[]', () => {
    it('detects root from workspace', async () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/*'],
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe('/test');
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
    });

    it('detects root from nested workspace', async () => {
      vol.fromJSON({
        '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/tooling/*'],
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/tooling/awesome-pkg')).resolves.toBe(
        '/test'
      );
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/tooling/*']);
    });

    it('detects root from root', async () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/*'],
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test')).resolves.toBe('/test');
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
    });

    it('ignores mismatching workspace', async () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['apps/*'],
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['apps/*']);
    });
  });

  describe('workspaces: packages: string[]', () => {
    it('detects root from workspace', async () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/*'] },
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe('/test');
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
    });

    it('detects root from nested workspace', async () => {
      vol.fromJSON({
        '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/tooling/*'] },
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/tooling/awesome-pkg')).resolves.toBe(
        '/test'
      );
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/tooling/*']);
    });

    it('detects root from root', async () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/*'] },
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test')).resolves.toBe('/test');
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
    });

    it('ignores mismatching workspace', async () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['apps/*'] },
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['apps/*']);
    });

    it('ignores invalid workspace config', async () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { nohoist: ['expo'] },
        }),
      });

      await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
      await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
    });
  });

  it('ignores invalid json in root', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': 'invalid json',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });

  it('ignores empty json in root', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': '',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });

  it('ignores folder named as package.json', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json/test.txt': 'this creates the folder',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });
});

describe('pnpm', () => {
  it('detects root from workspace', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe('/test');
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
  });

  it('detects root from nested workspace', async () => {
    vol.fromJSON({
      '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({
        packages: ['packages/tooling/*'],
      }),
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/tooling/awesome-pkg')).resolves.toBe(
      '/test'
    );
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/tooling/*']);
  });

  it('detects root from root', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    await expect(resolveWorkspaceRootAsync('/test')).resolves.toBe('/test');
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
  });

  it('ignores mismatching workspace', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['apps/*'] }),
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['apps/*']);
  });

  it('ignores invalid yaml in root', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': 'this: should be \n  invalid\n yaml',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });

  it('ignores empty yaml in root', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': '',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });

  it('ignores missing workspace package.json', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    // Note: in this case, its still correct to actually return the workspace globs
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toEqual(['packages/*']);
  });

  it('ignores folder named as package.json', async () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json/test.txt': 'this creates the folder',
    });

    await expect(resolveWorkspaceRootAsync('/test/packages/awesome-pkg')).resolves.toBe(null);
    await expect(getWorkspaceGlobsAsync('/test')).resolves.toBe(null);
  });
});
