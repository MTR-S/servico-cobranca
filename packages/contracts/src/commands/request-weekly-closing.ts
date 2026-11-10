import { z } from 'zod';

export const RequestWeeklyClosingSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('REQUEST_WEEKLY_CLOSING'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  groupId: z.string().min(1, 'groupId must be a non-empty string'),
  senderId: z.string().min(1, 'senderId must be a non-empty string'),
  source: z.literal('MANUAL_WHATSAPP').default('MANUAL_WHATSAPP'),
  metadata: z.record(z.unknown()).optional()
});

export type RequestWeeklyClosingCommand = z.infer<typeof RequestWeeklyClosingSchema>;
