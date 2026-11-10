import { z } from 'zod';

export const ForceWeeklyClosingSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('FORCE_WEEKLY_CLOSING'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  adminSenderId: z.string().min(1, 'adminSenderId must be a non-empty string'),
  targetPeriodDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'targetPeriodDate must be in YYYY-MM-DD format')
    .optional(),
  source: z.literal('ADMIN_FORCE').default('ADMIN_FORCE'),
  metadata: z.record(z.unknown()).optional()
});

export type ForceWeeklyClosingCommand = z.infer<typeof ForceWeeklyClosingSchema>;
