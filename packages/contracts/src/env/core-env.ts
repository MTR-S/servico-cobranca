import { z } from 'zod';
import { stringToList, booleanTransform, positiveNumberTransform } from './helpers';

export const RawCoreEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    TIMEZONE: z.string().default('America/Sao_Paulo'),
    RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
    GETNET_USERNAME: z.string().optional(),
    GETNET_PASSWORD: z.string().optional(),
    GETNET_MOCK_MODE: booleanTransform.default(false),
    TERMINAL_NUMBERS: stringToList('TERMINAL_NUMBERS'),
    COMMISSION_PERCENTAGE: positiveNumberTransform.default(5.0),
    SQLITE_DB_PATH: z.string().default('./data/sqlite.db'),
    PLAYWRIGHT_USER_DATA_DIR: z.string().default('./data/browser-profile'),
    IMPORTS_DIR: z.string().default('./data/imports'),
    SCREENSHOTS_DIR: z.string().default('./data/screenshots')
  })
  .superRefine((data, ctx) => {
    if (!data.GETNET_MOCK_MODE) {
      if (!data.GETNET_USERNAME || data.GETNET_USERNAME.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GETNET_USERNAME is required when GETNET_MOCK_MODE is false',
          path: ['GETNET_USERNAME']
        });
      }
      if (!data.GETNET_PASSWORD || data.GETNET_PASSWORD.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GETNET_PASSWORD is required when GETNET_MOCK_MODE is false',
          path: ['GETNET_PASSWORD']
        });
      }
    } else {
      if (!data.GETNET_USERNAME) {
        data.GETNET_USERNAME = 'mock_user';
      }
      if (!data.GETNET_PASSWORD) {
        data.GETNET_PASSWORD = 'mock_password';
      }
    }
  });

export type CoreEnv = z.infer<typeof RawCoreEnvSchema>;

export function validateCoreEnv(rawEnv: Record<string, unknown> = process.env): CoreEnv {
  return RawCoreEnvSchema.parse(rawEnv);
}
