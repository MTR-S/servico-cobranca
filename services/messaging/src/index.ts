import { validateMessagingEnv, loadEnv, MessagingEnv } from '@servico-cobranca/contracts';

export function initializeMessagingConfig(customEnv?: Record<string, unknown>): MessagingEnv {
  if (!customEnv) {
    loadEnv();
  }
  return validateMessagingEnv(customEnv);
}

export * from '@servico-cobranca/contracts';
