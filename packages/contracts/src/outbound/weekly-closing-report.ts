import { z } from 'zod';

export const TerminalClosingDetailSchema = z.object({
  terminalNumber: z.string().min(1, 'terminalNumber must be a non-empty string'),
  grossAmountInCents: z
    .number()
    .int('grossAmountInCents must be an integer')
    .nonnegative('grossAmountInCents must be non-negative'),
  transactionCount: z
    .number()
    .int('transactionCount must be an integer')
    .nonnegative('transactionCount must be non-negative')
});

export type TerminalClosingDetail = z.infer<typeof TerminalClosingDetailSchema>;

export const WeeklyClosingReportSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('WEEKLY_CLOSING_REPORT'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  recipient: z.string().min(1, 'recipient must be a non-empty string'),
  periodStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'periodStart must be in YYYY-MM-DD format'),
  periodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'periodEnd must be in YYYY-MM-DD format'),
  closedAt: z.string().datetime({ message: 'closedAt must be a valid ISO 8601 string' }),
  totalGrossAmountInCents: z
    .number()
    .int('totalGrossAmountInCents must be an integer')
    .nonnegative('totalGrossAmountInCents must be non-negative'),
  commissionPercentage: z.number().positive('commissionPercentage must be positive'),
  commissionAmountInCents: z
    .number()
    .int('commissionAmountInCents must be an integer')
    .nonnegative('commissionAmountInCents must be non-negative'),
  netTransferAmountInCents: z
    .number()
    .int('netTransferAmountInCents must be an integer')
    .nonnegative('netTransferAmountInCents must be non-negative'),
  terminals: z.array(TerminalClosingDetailSchema).default([]),
  formattedMessage: z.string().min(1, 'formattedMessage must be a non-empty string'),
  isReprocessing: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional()
});

export type WeeklyClosingReportMessage = z.infer<typeof WeeklyClosingReportSchema>;
