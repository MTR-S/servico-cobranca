import { z } from 'zod';
import { stringToList, booleanTransform, positiveNumberTransform } from './helpers';

export const RawAppEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    TIMEZONE: z.string().default('America/Sao_Paulo'),
    RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),

    // Getnet parameters
    GETNET_USERNAME: z.string().optional(),
    GETNET_PASSWORD: z.string().optional(),
    GETNET_MOCK_MODE: booleanTransform.default(false),

    // Business parameters
    TERMINAL_NUMBERS: stringToList('TERMINAL_NUMBERS'),
    COMMISSION_PERCENTAGE: positiveNumberTransform.default(5.0),

    // WhatsApp parameters
    WHATSAPP_GROUP_ID: z.string().min(1, 'WHATSAPP_GROUP_ID is required'),
    WHATSAPP_ALLOWED_SENDERS: stringToList('WHATSAPP_ALLOWED_SENDERS'),
    WHATSAPP_ADMIN_SENDERS: stringToList('WHATSAPP_ADMIN_SENDERS'),
    WHATSAPP_AUTH_MODE: z.enum(['QR_CODE', 'PAIRING_CODE']).default('QR_CODE'),
    WHATSAPP_PAIRING_PHONE_NUMBER: z.string().optional(),
    WHATSAPP_SESSION_PATH: z.string().default('./data/whatsapp-session'),

    // Storage and volume paths
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

    if (data.WHATSAPP_AUTH_MODE === 'PAIRING_CODE') {
      if (
        !data.WHATSAPP_PAIRING_PHONE_NUMBER ||
        data.WHATSAPP_PAIRING_PHONE_NUMBER.trim() === ''
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'WHATSAPP_PAIRING_PHONE_NUMBER is required when WHATSAPP_AUTH_MODE is PAIRING_CODE',
          path: ['WHATSAPP_PAIRING_PHONE_NUMBER']
        });
      }
    }
  });

export type AppEnv = z.infer<typeof RawAppEnvSchema>;

export function validateAppEnv(
  rawEnv: Record<string, unknown> = process.env
): AppEnv {
  return RawAppEnvSchema.parse(rawEnv);
}
