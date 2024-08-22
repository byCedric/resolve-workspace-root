import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { dump as stringifyYaml } from 'js-yaml';
import { fs, vol } from 'memfs';

import { resolveWorkspaceRoot } from '..';

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
    });

    it('detects root from root', () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: ['packages/*'],
        }),
      });

      expect(resolveWorkspaceRoot('/test')).toBe('/test');
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
    });

    it('detects root from root', () => {
      vol.fromJSON({
        '/test/package.json': JSON.stringify({
          name: 'workspace',
          workspaces: { packages: ['packages/*'] },
        }),
      });

      expect(resolveWorkspaceRoot('/test')).toBe('/test');
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
  });

  it('ignores empty json in root', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/package.json': '',
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
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
  });

  it('ignores missing workspace package.json', () => {
    vol.fromJSON({
      '/test/packages/awesome-pkg/package.json': JSON.stringify({
        name: 'awesome-pkg',
      }),
      '/test/pnpm-workspace.yaml': stringifyYaml({ packages: ['packages/*'] }),
    });

    expect(resolveWorkspaceRoot('/test/packages/awesome-pkg')).toBe(null);
  });
});
