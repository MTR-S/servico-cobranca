import { z } from 'zod';

export const ImportFallbackReportSchema = z.object({
  id: z.string().min(1, 'id must be a non-empty string'),
  type: z.literal('IMPORT_FALLBACK_REPORT'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 string' }),
  adminSenderId: z.string().min(1, 'adminSenderId must be a non-empty string'),
  filePath: z.string().min(1, 'filePath must be a non-empty string'),
  originalFileName: z.string().min(1, 'originalFileName must be a non-empty string').optional(),
  fileFormat: z.enum(['CSV', 'XLSX']).optional(),
  source: z.literal('CSV_FALLBACK').default('CSV_FALLBACK'),
  metadata: z.record(z.unknown()).optional()
});

export type ImportFallbackReportCommand = z.infer<typeof ImportFallbackReportSchema>;
