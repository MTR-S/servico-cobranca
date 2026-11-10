import { z } from 'zod';
import { stringToList } from './helpers';

export const RawMessagingEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    TIMEZONE: z.string().default('America/Sao_Paulo'),
    RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
    WHATSAPP_GROUP_ID: z.string().min(1, 'WHATSAPP_GROUP_ID is required'),
    WHATSAPP_ALLOWED_SENDERS: stringToList('WHATSAPP_ALLOWED_SENDERS'),
    WHATSAPP_ADMIN_SENDERS: stringToList('WHATSAPP_ADMIN_SENDERS'),
    WHATSAPP_AUTH_MODE: z.enum(['QR_CODE', 'PAIRING_CODE']).default('QR_CODE'),
    WHATSAPP_PAIRING_PHONE_NUMBER: z.string().optional(),
    WHATSAPP_SESSION_PATH: z.string().default('./data/whatsapp-session')
  })
  .superRefine((data, ctx) => {
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

export type MessagingEnv = z.infer<typeof RawMessagingEnvSchema>;

export function validateMessagingEnv(
  rawEnv: Record<string, unknown> = process.env
): MessagingEnv {
  return RawMessagingEnvSchema.parse(rawEnv);
}
