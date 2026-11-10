import { z } from 'zod';

export const GroupNoticeTypeSchema = z.enum([
  'OUTSIDE_SATURDAY_REJECTED',
  'PROCESSING_IN_PROGRESS',
  'PROCESSING_DELAY_NOTICE',
  'GENERIC_NOTICE'
]);

export type GroupNoticeType = z.infer<typeof GroupNoticeTypeSchema>;

export const GroupNoticeSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('GROUP_NOTICE'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  recipient: z.string().min(1, 'recipient must be a non-empty string'),
  noticeType: GroupNoticeTypeSchema,
  message: z.string().min(1, 'message must be a non-empty string'),
  metadata: z.record(z.unknown()).optional()
});

export type GroupNoticeMessage = z.infer<typeof GroupNoticeSchema>;
