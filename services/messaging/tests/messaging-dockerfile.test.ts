import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Messaging Service Dockerfile', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const dockerfilePath = path.join(rootDir, 'services/messaging/Dockerfile');

  it('Dockerfile exists in services/messaging', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  it('uses Node.js 20 base image in multi-stage build', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/FROM\s+node:20/i);
    expect(content).toMatch(/AS\s+builder/i);
    expect(content).toMatch(/AS\s+runner/i);
  });

  it('is lean and has NO Playwright, Chromium or SQLite system dependencies (per ADR 0002)', () => {
    const rawContent = fs.readFileSync(dockerfilePath, 'utf-8');
    // Strip comments to test actual docker instructions
    const instructionsOnly = rawContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');
    
    // Strict isolation - NO browser/playwright/chromium packages in instructions
    expect(instructionsOnly).not.toMatch(/chromium/i);
    expect(instructionsOnly).not.toMatch(/playwright/i);
    expect(instructionsOnly).not.toMatch(/libnss3/i);
    expect(instructionsOnly).not.toMatch(/libatk/i);
    expect(instructionsOnly).not.toMatch(/libcups/i);
    expect(instructionsOnly).not.toMatch(/libgbm/i);
    expect(instructionsOnly).not.toMatch(/libx11/i);

    // Strict isolation - NO sqlite packages in instructions
    expect(instructionsOnly).not.toMatch(/sqlite/i);
  });

  it('builds contracts and messaging workspaces', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/@servico-cobranca\/contracts/);
    expect(content).toMatch(/@servico-cobranca\/messaging/);
  });

  it('sets production environment and creates WhatsApp session persistence directory', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/NODE_ENV=production/);
    expect(content).toMatch(/whatsapp-session/);
  });

  it('uses exec form CMD to execute the compiled messaging entrypoint for clean signal handling', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/CMD\s*\[\s*"node",\s*"services\/messaging\/dist\/index\.js"\s*\]/);
  });
});
