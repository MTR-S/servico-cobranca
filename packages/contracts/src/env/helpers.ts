import { z } from 'zod';

export function stringToList(fieldName: string) {
  return z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (Array.isArray(val)) {
        return val.map((s) => s.trim()).filter(Boolean);
      }
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    })
    .pipe(
      z
        .array(z.string())
        .min(1, `${fieldName} must contain at least one non-empty value`)
    );
}

export const booleanTransform = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    return val.toLowerCase() === 'true' || val === '1';
  });

export const positiveNumberTransform = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  })
  .pipe(
    z
      .number()
      .positive('Value must be a positive number')
      .max(100, 'Commission percentage must not exceed 100%')
  );

export const commissionPercentageTransform = positiveNumberTransform;

export interface GetnetCredentialsTarget {
  GETNET_MOCK_MODE: boolean;
  GETNET_USERNAME?: string;
  GETNET_PASSWORD?: string;
}

export function refineGetnetCredentials(
  data: GetnetCredentialsTarget,
  ctx: z.RefinementCtx
): void {
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
    if (!data.GETNET_USERNAME || data.GETNET_USERNAME.trim() === '') {
      data.GETNET_USERNAME = 'mock_user';
    }
    if (!data.GETNET_PASSWORD || data.GETNET_PASSWORD.trim() === '') {
      data.GETNET_PASSWORD = 'mock_password';
    }
  }
}

export interface WhatsappPairingTarget {
  WHATSAPP_AUTH_MODE: 'QR_CODE' | 'PAIRING_CODE';
  WHATSAPP_PAIRING_PHONE_NUMBER?: string;
}

export function refineWhatsappPairing(
  data: WhatsappPairingTarget,
  ctx: z.RefinementCtx
): void {
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
}

export const commonEnvShape = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TIMEZONE: z.string().default('America/Sao_Paulo'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required')
};

export const coreEnvSpecificShape = {
  GETNET_USERNAME: z.string().optional(),
  GETNET_PASSWORD: z.string().optional(),
  GETNET_MOCK_MODE: booleanTransform.default(false),
  TERMINAL_NUMBERS: stringToList('TERMINAL_NUMBERS'),
  COMMISSION_PERCENTAGE: positiveNumberTransform.default(5.0),
  SQLITE_DB_PATH: z.string().default('./data/sqlite.db'),
  PLAYWRIGHT_USER_DATA_DIR: z.string().default('./data/browser-profile'),
  IMPORTS_DIR: z.string().default('./data/imports'),
  SCREENSHOTS_DIR: z.string().default('./data/screenshots')
};

export const messagingEnvSpecificShape = {
  WHATSAPP_GROUP_ID: z.string().min(1, 'WHATSAPP_GROUP_ID is required'),
  WHATSAPP_ALLOWED_SENDERS: stringToList('WHATSAPP_ALLOWED_SENDERS'),
  WHATSAPP_ADMIN_SENDERS: stringToList('WHATSAPP_ADMIN_SENDERS'),
  WHATSAPP_AUTH_MODE: z.enum(['QR_CODE', 'PAIRING_CODE']).default('QR_CODE'),
  WHATSAPP_PAIRING_PHONE_NUMBER: z.string().optional(),
  WHATSAPP_SESSION_PATH: z.string().default('./data/whatsapp-session')
};
