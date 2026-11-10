import { describe, it, expect } from 'vitest';
import { initializeCoreConfig } from '../src';

describe('Core Service Initialization', () => {
  it('initializes core configuration from valid env parameters', () => {
    const config = initializeCoreConfig({
      GETNET_USERNAME: 'test_user',
      GETNET_PASSWORD: 'test_password',
      GETNET_MOCK_MODE: 'false',
      TERMINAL_NUMBERS: '99887766',
      COMMISSION_PERCENTAGE: '5',
      RABBITMQ_URL: 'amqp://localhost:5672'
    });

    expect(config.GETNET_USERNAME).toBe('test_user');
    expect(config.TERMINAL_NUMBERS).toEqual(['99887766']);
    expect(config.COMMISSION_PERCENTAGE).toBe(5);
  });

  it('initializes core configuration from process.env when no argument is given', () => {
    const originalEnv = { ...process.env };
    process.env.GETNET_MOCK_MODE = 'true';
    process.env.TERMINAL_NUMBERS = '11223344';
    process.env.RABBITMQ_URL = 'amqp://localhost:5672';

    try {
      const config = initializeCoreConfig();
      expect(config.GETNET_MOCK_MODE).toBe(true);
      expect(config.TERMINAL_NUMBERS).toEqual(['11223344']);
    } finally {
      process.env = originalEnv;
    }
  });
});
