import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Compose Infrastructure', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const composePath = path.join(rootDir, 'docker-compose.yml');

  it('docker-compose.yml exists at root of the repository', () => {
    expect(fs.existsSync(composePath)).toBe(true);
  });

  it('declares the three core services: rabbitmq, core and messaging', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toMatch(/services:/);
    expect(content).toMatch(/rabbitmq:\s*\n/);
    expect(content).toMatch(/core:\s*\n/);
    expect(content).toMatch(/messaging:\s*\n/);
  });

  it('configures rabbitmq service with active healthcheck, ports and volume', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // RabbitMQ image with management plugin
    expect(content).toMatch(/image:\s*rabbitmq:3.*management/i);

    // AMQP and Management UI ports
    expect(content).toMatch(/["']5672:5672["']/);
    expect(content).toMatch(/["']15672:15672["']/);

    // Active healthcheck using rabbitmq-diagnostics or rabbitmqctl
    expect(content).toMatch(/healthcheck:/);
    expect(content).toMatch(/rabbitmq-diagnostics|rabbitmqctl/);
    expect(content).toMatch(/interval:/);
    expect(content).toMatch(/timeout:/);
    expect(content).toMatch(/retries:/);

    // Persistent volume for broker
    expect(content).toMatch(/rabbitmq_data:/);
  });

  it('configures core service with root build context, healthcheck dependency and .env injection', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // Build context and Dockerfile
    expect(content).toMatch(/dockerfile:\s*services\/core\/Dockerfile/);

    // Depends on rabbitmq with healthy condition
    expect(content).toMatch(/condition:\s*service_healthy/);

    // Injects environment variables from .env
    expect(content).toMatch(/env_file:\s*\n\s*-\s*\.env/);

    // Points RABBITMQ_URL to internal rabbitmq host
    expect(content).toMatch(/RABBITMQ_URL.*@rabbitmq:5672/);
  });

  it('configures persistent volumes in ./data/ for core service (SQLite, browser-profile, imports)', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // Persistent volume mappings for Core
    expect(content).toMatch(/\.\/data(\/sqlite\.db)?:\/app\/data/);
    expect(content).toMatch(/\.\/data\/browser-profile:\/app\/data\/browser-profile/);
    expect(content).toMatch(/\.\/data\/imports:\/app\/data\/imports/);
    expect(content).toMatch(/\.\/data\/screenshots:\/app\/data\/screenshots/);
  });

  it('configures messaging service with root build context, healthcheck dependency and whatsapp session volume', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // Build context and Dockerfile
    expect(content).toMatch(/dockerfile:\s*services\/messaging\/Dockerfile/);

    // Depends on rabbitmq with healthy condition
    expect(content).toMatch(/condition:\s*service_healthy/);

    // Injects environment variables from .env
    expect(content).toMatch(/env_file:\s*\n\s*-\s*\.env/);

    // Persistent volume for WhatsApp session
    expect(content).toMatch(/\.\/data\/whatsapp-session:\/app\/data\/whatsapp-session/);
  });

  it('isolates messaging service from SQLite, browser-profile and imports volumes', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // Find messaging service section in docker-compose.yml
    const messagingSection = content.split(/messaging:\s*\n/)[1]?.split(/\n[a-zA-Z0-9_-]+:\s*\n/)[0] || '';
    
    expect(messagingSection).not.toMatch(/browser-profile/);
    expect(messagingSection).not.toMatch(/imports/);
    expect(messagingSection).not.toMatch(/sqlite/);
  });

  it('declares and connects all three services to a dedicated internal network', () => {
    const content = fs.readFileSync(composePath, 'utf-8');
    
    // Top-level networks section
    expect(content).toMatch(/networks:\s*\n\s+([a-zA-Z0-9_-]+):/);

    // All services connect to the dedicated network
    const services = ['rabbitmq', 'core', 'messaging'];
    for (const service of services) {
      const serviceMatch = new RegExp(`${service}:[\\s\\S]*?networks:[\\s\\S]*?-`, 'm');
      expect(content).toMatch(serviceMatch);
    }
  });
});
