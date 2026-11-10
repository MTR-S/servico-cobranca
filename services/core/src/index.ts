import { validateCoreEnv, loadEnv, CoreEnv } from '@servico-cobranca/contracts';

export function initializeCoreConfig(customEnv?: Record<string, unknown>): CoreEnv {
  if (!customEnv) {
    loadEnv();
  }
  return validateCoreEnv(customEnv);
}

export * from '@servico-cobranca/contracts';
