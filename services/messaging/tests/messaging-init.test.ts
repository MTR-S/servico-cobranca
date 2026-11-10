import { describe, it, expect } from 'vitest';
import { initializeMessagingConfig } from '../src';

describe('Messaging Service Initialization', () => {
  it('initializes messaging configuration from valid env parameters', () => {
    const config = initializeMessagingConfig({
      WHATSAPP_GROUP_ID: '120363021234567890@g.us',
      WHATSAPP_ALLOWED_SENDERS: '5511999999999',
      WHATSAPP_ADMIN_SENDERS: '5511999999999',
      RABBITMQ_URL: 'amqp://localhost:5672'
    });

    expect(config.WHATSAPP_GROUP_ID).toBe('120363021234567890@g.us');
    expect(config.WHATSAPP_ALLOWED_SENDERS).toEqual(['5511999999999']);
    expect(config.WHATSAPP_ADMIN_SENDERS).toEqual(['5511999999999']);
  });

  it('initializes messaging configuration from process.env when no argument is given', () => {
    const originalEnv = { ...process.env };
    process.env.WHATSAPP_GROUP_ID = '120363021234567890@g.us';
    process.env.WHATSAPP_ALLOWED_SENDERS = '5511999999999';
    process.env.WHATSAPP_ADMIN_SENDERS = '5511999999999';
    process.env.RABBITMQ_URL = 'amqp://localhost:5672';

    try {
      const config = initializeMessagingConfig();
      expect(config.WHATSAPP_GROUP_ID).toBe('120363021234567890@g.us');
      expect(config.WHATSAPP_ALLOWED_SENDERS).toEqual(['5511999999999']);
    } finally {
      process.env = originalEnv;
    }
  });
});
