import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Architecture & Monorepo Boundaries', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('root package.json defines workspaces for packages and services', () => {
    const rootPkg = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')
    );
    expect(rootPkg.private).toBe(true);
    expect(rootPkg.workspaces).toEqual(
      expect.arrayContaining(['packages/*', 'services/*'])
    );
  });

  it('services/core package.json has NO whatsapp/baileys dependencies', () => {
    const corePkg = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'services/core/package.json'), 'utf-8')
    );
    const deps = {
      ...(corePkg.dependencies || {}),
      ...(corePkg.devDependencies || {})
    };
    const depNames = Object.keys(deps);

    for (const name of depNames) {
      expect(name).not.toMatch(/baileys/i);
      expect(name).not.toMatch(/whatsapp/i);
    }
  });

  it('services/messaging package.json has NO playwright or database dependencies', () => {
    const msgPkg = JSON.parse(
      fs.readFileSync(
        path.join(rootDir, 'services/messaging/package.json'),
        'utf-8'
      )
    );
    const deps = {
      ...(msgPkg.dependencies || {}),
      ...(msgPkg.devDependencies || {})
    };
    const depNames = Object.keys(deps);

    for (const name of depNames) {
      expect(name).not.toMatch(/playwright/i);
      expect(name).not.toMatch(/sqlite/i);
      expect(name).not.toMatch(/better-sqlite3/i);
      expect(name).not.toMatch(/prisma/i);
    }
  });

  it('packages/contracts has NO playwright, whatsapp, or database dependencies', () => {
    const contractsPkg = JSON.parse(
      fs.readFileSync(
        path.join(rootDir, 'packages/contracts/package.json'),
        'utf-8'
      )
    );
    const deps = {
      ...(contractsPkg.dependencies || {}),
      ...(contractsPkg.devDependencies || {})
    };
    const depNames = Object.keys(deps);

    for (const name of depNames) {
      expect(name).not.toMatch(/playwright/i);
      expect(name).not.toMatch(/baileys/i);
      expect(name).not.toMatch(/whatsapp/i);
      expect(name).not.toMatch(/sqlite/i);
    }
  });
});
