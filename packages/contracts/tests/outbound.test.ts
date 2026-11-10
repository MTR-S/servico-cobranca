import { describe, it, expect } from 'vitest';
import {
  WeeklyClosingReportSchema,
  GroupNoticeSchema,
  AdminTechnicalAlertSchema,
  WhatsappOutboundMessageSchema,
  parseWhatsappOutboundMessage,
  QUEUES
} from '../src';

describe('whatsapp.outbound Contracts', () => {
  it('exposes correct queue name constants', () => {
    expect(QUEUES.WHATSAPP_OUTBOUND).toBe('whatsapp.outbound');
    expect(QUEUES.WHATSAPP_OUTBOUND_DLQ).toBe('whatsapp.outbound.dlq');
  });

  describe('WEEKLY_CLOSING_REPORT', () => {
    const validPayload = {
      id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
      type: 'WEEKLY_CLOSING_REPORT' as const,
      timestamp: '2026-11-14T21:30:00.000Z',
      recipient: '120363021234567890@g.us',
      periodStart: '2026-11-08',
      periodEnd: '2026-11-14',
      closedAt: '2026-11-14T21:30:00.000Z',
      totalGrossAmountInCents: 255220,
      commissionPercentage: 5.0,
      commissionAmountInCents: 12761,
      netTransferAmountInCents: 242459,
      terminals: [
        { terminalNumber: '12345678', grossAmountInCents: 155220, transactionCount: 15 },
        { terminalNumber: '87654321', grossAmountInCents: 100000, transactionCount: 10 }
      ],
      formattedMessage:
        '* Valor Bruto  = R$2.552,20\n* Comissão (5%) = R$127,61\n* Valor a Pagar = R$2.552,20 - R$127,61 = R$2.424,59',
      isReprocessing: false
    };

    it('parses valid payload successfully', () => {
      const result = WeeklyClosingReportSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('parses through discriminated union helper', () => {
      const parsed = parseWhatsappOutboundMessage(validPayload);
      expect(parsed.type).toBe('WEEKLY_CLOSING_REPORT');
      if (parsed.type === 'WEEKLY_CLOSING_REPORT') {
        expect(parsed.totalGrossAmountInCents).toBe(255220);
        expect(parsed.commissionAmountInCents).toBe(12761);
        expect(parsed.netTransferAmountInCents).toBe(242459);
      }
    });

    it('defaults terminals to empty array and isReprocessing to false when omitted', () => {
      const { terminals, isReprocessing, ...rest } = validPayload;
      const parsed = WeeklyClosingReportSchema.parse(rest);
      expect(parsed.terminals).toEqual([]);
      expect(parsed.isReprocessing).toBe(false);
    });

    it('fails when totalGrossAmountInCents is negative', () => {
      const invalid = { ...validPayload, totalGrossAmountInCents: -1 };
      expect(() => WeeklyClosingReportSchema.parse(invalid)).toThrow();
    });

    it('fails when totalGrossAmountInCents is a float instead of integer', () => {
      const invalid = { ...validPayload, totalGrossAmountInCents: 2552.2 };
      expect(() => WeeklyClosingReportSchema.parse(invalid)).toThrow();
    });

    it('fails when periodStart is not YYYY-MM-DD', () => {
      const invalid = { ...validPayload, periodStart: '08-11-2026' };
      expect(() => WeeklyClosingReportSchema.parse(invalid)).toThrow();
    });

    it('fails when recipient is empty', () => {
      const invalid = { ...validPayload, recipient: '' };
      expect(() => WeeklyClosingReportSchema.parse(invalid)).toThrow();
    });

    it('fails when formattedMessage is empty', () => {
      const invalid = { ...validPayload, formattedMessage: '' };
      expect(() => WeeklyClosingReportSchema.parse(invalid)).toThrow();
    });
  });

  describe('GROUP_NOTICE', () => {
    const validPayload = {
      id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
      type: 'GROUP_NOTICE' as const,
      timestamp: '2026-11-10T14:00:00.000Z',
      recipient: '120363021234567890@g.us',
      noticeType: 'OUTSIDE_SATURDAY_REJECTED' as const,
      message: 'O Fechamento Semanal padrão só pode ser solicitado aos sábados.'
    };

    it('parses valid payload successfully', () => {
      const result = GroupNoticeSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('fails when message is empty', () => {
      const invalid = { ...validPayload, message: '' };
      expect(() => GroupNoticeSchema.parse(invalid)).toThrow();
    });

    it('fails when noticeType is unsupported', () => {
      const invalid = { ...validPayload, noticeType: 'UNSUPPORTED_NOTICE' };
      expect(() => GroupNoticeSchema.parse(invalid)).toThrow();
    });
  });

  describe('ADMIN_TECHNICAL_ALERT', () => {
    const validPayload = {
      id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
      type: 'ADMIN_TECHNICAL_ALERT' as const,
      timestamp: '2026-11-14T21:35:00.000Z',
      recipients: ['5511999999999'],
      alertType: 'SCRAPING_FAILURE' as const,
      message: 'Falha ao acessar o portal Minha Conta Getnet após 2 tentativas.',
      errorDetails: 'Timeout waiting for selector #grid-sales',
      screenshotPath: './data/screenshots/error_2026-11-14.png'
    };

    it('parses valid payload successfully', () => {
      const result = AdminTechnicalAlertSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('parses without optional errorDetails and screenshotPath', () => {
      const { errorDetails, screenshotPath, ...rest } = validPayload;
      const parsed = AdminTechnicalAlertSchema.parse(rest);
      expect(parsed.errorDetails).toBeUndefined();
      expect(parsed.screenshotPath).toBeUndefined();
    });

    it('fails when recipients is empty array', () => {
      const invalid = { ...validPayload, recipients: [] };
      expect(() => AdminTechnicalAlertSchema.parse(invalid)).toThrow();
    });

    it('fails when alertType is invalid', () => {
      const invalid = { ...validPayload, alertType: 'UNKNOWN_ALERT' };
      expect(() => AdminTechnicalAlertSchema.parse(invalid)).toThrow();
    });
  });

  describe('Discriminated Union validation', () => {
    it('fails when outbound type is unknown', () => {
      const unknown = {
        id: '123',
        type: 'UNKNOWN_OUTBOUND',
        timestamp: '2026-11-14T20:30:00.000Z'
      };
      expect(() => parseWhatsappOutboundMessage(unknown)).toThrow();
    });
  });
});
