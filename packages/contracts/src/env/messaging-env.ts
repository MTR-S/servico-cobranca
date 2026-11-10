import { z } from 'zod';
import {
  commonEnvShape,
  messagingEnvSpecificShape,
  refineWhatsappPairing
} from './helpers';

export const RawMessagingEnvSchema = z
  .object({
    ...commonEnvShape,
    ...messagingEnvSpecificShape
  })
  .superRefine(refineWhatsappPairing);

export type MessagingEnv = z.infer<typeof RawMessagingEnvSchema>;

export function validateMessagingEnv(
  rawEnv: Record<string, unknown> = process.env
): MessagingEnv {
  return RawMessagingEnvSchema.parse(rawEnv);
}
