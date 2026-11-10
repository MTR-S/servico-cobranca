import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateCoreEnv,
  validateMessagingEnv,
  validateAppEnv,
  loadEnv
} from '../src';

describe('Environment Variables Loading and Validation', () => {
  const validCommon = {
    NODE_ENV: 'test',
    TIMEZONE: 'America/Sao_Paulo',
    RABBITMQ_URL: 'amqp://guest:guest@localhost:5672'
  };

  const validCoreParams = {
    ...validCommon,
    GETNET_USERNAME: 'test_user',
    GETNET_PASSWORD: 'test_password',
    GETNET_MOCK_MODE: 'false',
    TERMINAL_NUMBERS: '12345678,87654321',
    COMMISSION_PERCENTAGE: '5.0',
    SQLITE_DB_PATH: './data/sqlite.db',
    PLAYWRIGHT_USER_DATA_DIR: './data/browser-profile',
    IMPORTS_DIR: './data/imports',
    SCREENSHOTS_DIR: './data/screenshots'
  };

  const validMessagingParams = {
    ...validCommon,
    WHATSAPP_GROUP_ID: '120363021234567890@g.us',
    WHATSAPP_ALLOWED_SENDERS: '5511999999999,5511888888888',
    WHATSAPP_ADMIN_SENDERS: '5511999999999',
    WHATSAPP_AUTH_MODE: 'QR_CODE',
    WHATSAPP_SESSION_PATH: './data/whatsapp-session'
  };

  const validAppParams = {
    ...validCoreParams,
    ...validMessagingParams
  };

  describe('Core Environment Validation', () => {
    it('validates a complete valid Core env and transforms terminal numbers and commission', () => {
      const config = validateCoreEnv(validCoreParams);
      expect(config.GETNET_USERNAME).toBe('test_user');
      expect(config.GETNET_PASSWORD).toBe('test_password');
      expect(config.GETNET_MOCK_MODE).toBe(false);
      expect(config.TERMINAL_NUMBERS).toEqual(['12345678', '87654321']);
      expect(config.COMMISSION_PERCENTAGE).toBe(5.0);
      expect(config.RABBITMQ_URL).toBe('amqp://guest:guest@localhost:5672');
      expect(config.TIMEZONE).toBe('America/Sao_Paulo');
    });

    it('allows missing credentials when GETNET_MOCK_MODE is true', () => {
      const { GETNET_USERNAME, GETNET_PASSWORD, ...rest } = validCoreParams;
      const config = validateCoreEnv({
        ...rest,
        GETNET_MOCK_MODE: 'true'
      });
      expect(config.GETNET_MOCK_MODE).toBe(true);
      expect(config.GETNET_USERNAME).toBeDefined();
    });

    it('fails when GETNET_MOCK_MODE is false and credentials are missing', () => {
      const { GETNET_USERNAME, ...rest } = validCoreParams;
      expect(() => validateCoreEnv(rest)).toThrow(/GETNET_USERNAME/i);
    });

    it('fails when TERMINAL_NUMBERS is empty or missing', () => {
      expect(() =>
        validateCoreEnv({ ...validCoreParams, TERMINAL_NUMBERS: '' })
      ).toThrow();
      const { TERMINAL_NUMBERS, ...rest } = validCoreParams;
      expect(() => validateCoreEnv(rest)).toThrow();
    });

    it('fails when COMMISSION_PERCENTAGE is invalid or non-positive', () => {
      expect(() =>
        validateCoreEnv({ ...validCoreParams, COMMISSION_PERCENTAGE: '0' })
      ).toThrow();
      expect(() =>
        validateCoreEnv({ ...validCoreParams, COMMISSION_PERCENTAGE: '-5' })
      ).toThrow();
      expect(() =>
        validateCoreEnv({ ...validCoreParams, COMMISSION_PERCENTAGE: 'abc' })
      ).toThrow();
    });

    it('fails when RABBITMQ_URL is missing', () => {
      const { RABBITMQ_URL, ...rest } = validCoreParams;
      expect(() => validateCoreEnv(rest)).toThrow(/RABBITMQ_URL/i);
    });
  });

  describe('Messaging Environment Validation', () => {
    it('validates a complete valid Messaging env and parses sender lists', () => {
      const config = validateMessagingEnv(validMessagingParams);
      expect(config.WHATSAPP_GROUP_ID).toBe('120363021234567890@g.us');
      expect(config.WHATSAPP_ALLOWED_SENDERS).toEqual([
        '5511999999999',
        '5511888888888'
      ]);
      expect(config.WHATSAPP_ADMIN_SENDERS).toEqual(['5511999999999']);
      expect(config.WHATSAPP_AUTH_MODE).toBe('QR_CODE');
    });

    it('fails when WHATSAPP_GROUP_ID is missing', () => {
      const { WHATSAPP_GROUP_ID, ...rest } = validMessagingParams;
      expect(() => validateMessagingEnv(rest)).toThrow(/WHATSAPP_GROUP_ID/i);
    });

    it('fails when WHATSAPP_ALLOWED_SENDERS is empty', () => {
      expect(() =>
        validateMessagingEnv({
          ...validMessagingParams,
          WHATSAPP_ALLOWED_SENDERS: ''
        })
      ).toThrow();
    });

    it('fails when WHATSAPP_AUTH_MODE is PAIRING_CODE and WHATSAPP_PAIRING_PHONE_NUMBER is missing', () => {
      expect(() =>
        validateMessagingEnv({
          ...validMessagingParams,
          WHATSAPP_AUTH_MODE: 'PAIRING_CODE'
        })
      ).toThrow(/WHATSAPP_PAIRING_PHONE_NUMBER/i);
    });

    it('succeeds when WHATSAPP_AUTH_MODE is PAIRING_CODE and phone number is provided', () => {
      const config = validateMessagingEnv({
        ...validMessagingParams,
        WHATSAPP_AUTH_MODE: 'PAIRING_CODE',
        WHATSAPP_PAIRING_PHONE_NUMBER: '5511999999999'
      });
      expect(config.WHATSAPP_AUTH_MODE).toBe('PAIRING_CODE');
      expect(config.WHATSAPP_PAIRING_PHONE_NUMBER).toBe('5511999999999');
    });
  });

  describe('Full App Environment Validation & Loading', () => {
    it('validates the combined environment successfully', () => {
      const config = validateAppEnv(validAppParams);
      expect(config.GETNET_USERNAME).toBe('test_user');
      expect(config.WHATSAPP_GROUP_ID).toBe('120363021234567890@g.us');
      expect(config.TERMINAL_NUMBERS).toEqual(['12345678', '87654321']);
      expect(config.WHATSAPP_ALLOWED_SENDERS).toEqual([
        '5511999999999',
        '5511888888888'
      ]);
    });

    it('.env.example file matches required schema variables', () => {
      const rootDir = path.resolve(__dirname, '../../..');
      const exampleContent = fs.readFileSync(
        path.join(rootDir, '.env.example'),
        'utf-8'
      );

      expect(exampleContent).toContain('GETNET_USERNAME');
      expect(exampleContent).toContain('GETNET_PASSWORD');
      expect(exampleContent).toContain('GETNET_MOCK_MODE');
      expect(exampleContent).toContain('TERMINAL_NUMBERS');
      expect(exampleContent).toContain('COMMISSION_PERCENTAGE');
      expect(exampleContent).toContain('WHATSAPP_GROUP_ID');
      expect(exampleContent).toContain('WHATSAPP_ALLOWED_SENDERS');
      expect(exampleContent).toContain('WHATSAPP_ADMIN_SENDERS');
      expect(exampleContent).toContain('RABBITMQ_URL');
      expect(exampleContent).toContain('SQLITE_DB_PATH');
    });

    it('.gitignore ignores .env, databases, sessions, and data directories', () => {
      const rootDir = path.resolve(__dirname, '../../..');
      const gitignore = fs.readFileSync(
        path.join(rootDir, '.gitignore'),
        'utf-8'
      );

      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('*.db');
      expect(gitignore).toContain('data/');
      expect(gitignore).toContain('whatsapp-session/');
    });

    it('loadEnv loads configuration safely when custom path is provided', () => {
      const result = loadEnv({ path: path.resolve(__dirname, 'non-existent.env') });
      expect(result).toBeDefined();
    });
  });
});
