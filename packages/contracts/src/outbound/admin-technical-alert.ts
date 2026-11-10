import { z } from 'zod';

export const AdminAlertTypeSchema = z.enum([
  'SCRAPING_FAILURE',
  'AUTH_OR_2FA_CHALLENGE',
  'SYSTEM_ERROR',
  'FALLBACK_NEEDED'
]);

export type AdminAlertType = z.infer<typeof AdminAlertTypeSchema>;

export const AdminTechnicalAlertSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('ADMIN_TECHNICAL_ALERT'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  recipients: z.array(z.string().min(1)).min(1, 'at least one recipient is required'),
  alertType: AdminAlertTypeSchema,
  message: z.string().min(1, 'message must be a non-empty string'),
  errorDetails: z.string().optional(),
  screenshotPath: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type AdminTechnicalAlertMessage = z.infer<typeof AdminTechnicalAlertSchema>;
