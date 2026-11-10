import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Core Service Dockerfile', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const dockerfilePath = path.join(rootDir, 'services/core/Dockerfile');

  it('Dockerfile exists in services/core', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  it('uses Node.js 20 base image in multi-stage build', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/FROM\s+node:20/i);
    expect(content).toMatch(/AS\s+builder/i);
    expect(content).toMatch(/AS\s+runner/i);
  });

  it('configures system dependencies for headless Chromium/Playwright and SQLite', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    
    // SQLite dependencies
    expect(content).toMatch(/sqlite3/);

    // Chromium & Playwright headless system dependencies
    expect(content).toMatch(/libnss3/);
    expect(content).toMatch(/libatk/);
    expect(content).toMatch(/libcairo2/);
    expect(content).toMatch(/libcups2/);
    expect(content).toMatch(/libdrm2/);
    expect(content).toMatch(/libgbm1/);
    expect(content).toMatch(/libpango/);
    expect(content).toMatch(/libasound2/);
    expect(content).toMatch(/fonts-liberation/);
    expect(content).toMatch(/libxkbcommon0/);
  });

  it('builds contracts and core workspaces', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/@servico-cobranca\/contracts/);
    expect(content).toMatch(/@servico-cobranca\/core/);
  });

  it('sets production environment, Playwright browser path and default directories', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/NODE_ENV=production/);
    expect(content).toMatch(/PLAYWRIGHT_BROWSERS_PATH/);
    expect(content).toMatch(/browser-profile/);
    expect(content).toMatch(/imports/);
    expect(content).toMatch(/screenshots/);
  });

  it('uses exec form CMD to execute the compiled core entrypoint for clean signal handling', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/CMD\s*\[\s*"node",\s*"services\/core\/dist\/index\.js"\s*\]/);
  });
});
