import { describe, it, expect } from 'vitest';
import {
  RequestWeeklyClosingSchema,
  ForceWeeklyClosingSchema,
  ImportFallbackReportSchema,
  ClosingCommandSchema,
  parseClosingCommand,
  QUEUES
} from '../src';

describe('closing.commands Contracts', () => {
  it('exposes correct queue name constants', () => {
    expect(QUEUES.CLOSING_COMMANDS).toBe('closing.commands');
    expect(QUEUES.CLOSING_COMMANDS_DLQ).toBe('closing.commands.dlq');
  });

  describe('REQUEST_WEEKLY_CLOSING', () => {
    const validPayload = {
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      type: 'REQUEST_WEEKLY_CLOSING' as const,
      timestamp: '2026-11-14T20:30:00.000Z',
      groupId: '120363021234567890@g.us',
      senderId: '5511999999999',
      source: 'MANUAL_WHATSAPP' as const
    };

    it('parses valid payload successfully', () => {
      const result = RequestWeeklyClosingSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('parses correctly through discriminated union and helper', () => {
      const parsed = parseClosingCommand(validPayload);
      expect(parsed.type).toBe('REQUEST_WEEKLY_CLOSING');
      if (parsed.type === 'REQUEST_WEEKLY_CLOSING') {
        expect(parsed.groupId).toBe('120363021234567890@g.us');
        expect(parsed.senderId).toBe('5511999999999');
      }
    });

    it('defaults source to MANUAL_WHATSAPP if omitted', () => {
      const { source, ...withoutSource } = validPayload;
      const parsed = RequestWeeklyClosingSchema.parse(withoutSource);
      expect(parsed.source).toBe('MANUAL_WHATSAPP');
    });

    it('fails when groupId is missing', () => {
      const invalid = { ...validPayload, groupId: '' };
      expect(() => RequestWeeklyClosingSchema.parse(invalid)).toThrow();
    });

    it('fails when senderId is missing', () => {
      const invalid = { ...validPayload, senderId: '' };
      expect(() => RequestWeeklyClosingSchema.parse(invalid)).toThrow();
    });

    it('fails when timestamp is invalid', () => {
      const invalid = { ...validPayload, timestamp: 'not-a-date' };
      expect(() => RequestWeeklyClosingSchema.parse(invalid)).toThrow();
    });
  });

  describe('FORCE_WEEKLY_CLOSING', () => {
    const validPayload = {
      id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      type: 'FORCE_WEEKLY_CLOSING' as const,
      timestamp: '2026-11-14T21:00:00.000Z',
      adminSenderId: '5511999999999',
      targetPeriodDate: '2026-11-08',
      source: 'ADMIN_FORCE' as const
    };

    it('parses valid payload successfully', () => {
      const result = ForceWeeklyClosingSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('parses without optional targetPeriodDate', () => {
      const { targetPeriodDate, ...withoutTarget } = validPayload;
      const parsed = ForceWeeklyClosingSchema.parse(withoutTarget);
      expect(parsed.targetPeriodDate).toBeUndefined();
      expect(parsed.source).toBe('ADMIN_FORCE');
    });

    it('fails when adminSenderId is missing', () => {
      const invalid = { ...validPayload, adminSenderId: '' };
      expect(() => ForceWeeklyClosingSchema.parse(invalid)).toThrow();
    });

    it('fails when targetPeriodDate is not in YYYY-MM-DD format', () => {
      const invalid = { ...validPayload, targetPeriodDate: '14-11-2026' };
      expect(() => ForceWeeklyClosingSchema.parse(invalid)).toThrow();
    });
  });

  describe('IMPORT_FALLBACK_REPORT', () => {
    const validPayload = {
      id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      type: 'IMPORT_FALLBACK_REPORT' as const,
      timestamp: '2026-11-14T21:15:00.000Z',
      adminSenderId: '5511999999999',
      filePath: './data/imports/relatorio_getnet_semana.xlsx',
      originalFileName: 'relatorio_getnet_semana.xlsx',
      fileFormat: 'XLSX' as const,
      source: 'CSV_FALLBACK' as const
    };

    it('parses valid payload successfully', () => {
      const result = ImportFallbackReportSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('defaults source to CSV_FALLBACK if omitted', () => {
      const { source, ...withoutSource } = validPayload;
      const parsed = ImportFallbackReportSchema.parse(withoutSource);
      expect(parsed.source).toBe('CSV_FALLBACK');
    });

    it('fails when filePath is empty', () => {
      const invalid = { ...validPayload, filePath: '' };
      expect(() => ImportFallbackReportSchema.parse(invalid)).toThrow();
    });

    it('fails when fileFormat is invalid', () => {
      const invalid = { ...validPayload, fileFormat: 'PDF' };
      expect(() => ImportFallbackReportSchema.parse(invalid)).toThrow();
    });
  });

  describe('Discriminated Union validation', () => {
    it('fails when command type is unknown', () => {
      const unknown = {
        id: '123',
        type: 'UNSUPPORTED_COMMAND',
        timestamp: '2026-11-14T20:30:00.000Z'
      };
      expect(() => parseClosingCommand(unknown)).toThrow();
    });

    it('fails when payload is not an object', () => {
      expect(() => parseClosingCommand(null)).toThrow();
      expect(() => parseClosingCommand('not an object')).toThrow();
    });
  });
});
