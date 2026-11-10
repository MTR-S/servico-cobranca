import { z } from 'zod';
import {
  commonEnvShape,
  coreEnvSpecificShape,
  messagingEnvSpecificShape,
  refineGetnetCredentials,
  refineWhatsappPairing
} from './helpers';

export const RawAppEnvSchema = z
  .object({
    ...commonEnvShape,
    ...coreEnvSpecificShape,
    ...messagingEnvSpecificShape
  })
  .superRefine(refineGetnetCredentials)
  .superRefine(refineWhatsappPairing);

export type AppEnv = z.infer<typeof RawAppEnvSchema>;

export function validateAppEnv(
  rawEnv: Record<string, unknown> = process.env
): AppEnv {
  return RawAppEnvSchema.parse(rawEnv);
}
