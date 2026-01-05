import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { dump as stringifyYaml } from 'js-yaml';
import { fs, vol } from 'memfs';

import { resolveWorkspaceRoot, getWorkspaceGlobs } from '..';

mock.module('node:fs', () => ({ default: fs }));

beforeEach(() => vol.reset());

describe('bun, npm, yarn', () => {
  describe('workspaces: string[]', () => {
    it('detects root from workspace', () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/*'],
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
    });

    it('detects root from nested workspace', () => {
      vol.fromJSON({
        '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/tooling/*'],
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/tooling/awesome-pkg')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/tooling/*']);
    });

    it('detects root from root', () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/*'],
        }),
      });

      expect(resolveWorkspaceRoot('/test')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
    });

    it('ignores mismatching workspace', () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['apps/*'],
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
      expect(getWorkspaceGlobs('/test')).toEqual(['apps/*']);
    });
  });

  describe('workspaces: packages: string[]', () => {
    it('detects root from workspace', () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/*'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
    });

    it('detects root from nested workspace', () => {
      vol.fromJSON({
        '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/tooling/*'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/tooling/awesome-pkg')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/tooling/*']);
    });

    it('detects root from root', () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/*'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test')).toBe('/test');
      expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
    });

    it('ignores mismatching workspace', () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['apps/*'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
      expect(getWorkspaceGlobs('/test')).toEqual(['apps/*']);
    });

    it('ignores invalid workspace config', () => {
      vol.fromJSON({
        '/test/packages/awesome-pkg/package.json': JSON.stringify({
          name: 'awesome-pkg',
        }),
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { nohoist: ['expo'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
      expect(getWorkspaceGlobs('/test')).toEqual(null);
    });
  });

  it('ignores invalid json in root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': 'invalid json',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });

  it('ignores empty json in root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': '',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });

  it('ignores folder named as package.json', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json/test.txt': 'this creates the folder',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });
});

describe('pnpm', () => {
  it('detects root from workspace', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe('/test');
    expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
  });

  it('detects root from nested workspace', () => {
    vol.fromJSON({
      '/test/packages/tooling/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({
        packages: ['packages/tooling/*'],
      }),
    });

    expect(resolveWorkspaceRoot('/test/packages/tooling/awesome-pkg')).toBe('/test');
    expect(getWorkspaceGlobs('/test')).toEqual(['packages/tooling/*']);
  });

  it('detects root from root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    expect(resolveWorkspaceRoot('/test')).toBe('/test');
    expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
  });

  it('detects root with missing package.json', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe('/test');
    // Note: in this case, its still correct to actually return the workspace globs
    expect(getWorkspaceGlobs('/test')).toEqual(['packages/*']);
  });

  it('ignores mismatching workspace', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['apps/*'] }),
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(['apps/*']);
  });

  it('ignores invalid yaml in root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': 'this: should be \n  invalid\n yaml',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });

  it('ignores empty yaml in root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': JSON.stringify({ name: 'awesome-pkg' }),
      '/test/pnpm-workspace.yaml': '',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });

  it('ignores folder named as package.json', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json/test.txt': 'this creates the folder',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
    expect(getWorkspaceGlobs('/test')).toEqual(null);
  });
});
