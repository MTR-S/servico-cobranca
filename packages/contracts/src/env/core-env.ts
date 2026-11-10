import { z } from 'zod';
import {
  commonEnvShape,
  coreEnvSpecificShape,
  refineGetnetCredentials
} from './helpers';

export const RawCoreEnvSchema = z
  .object({
    ...commonEnvShape,
    ...coreEnvSpecificShape
  })
  .superRefine(refineGetnetCredentials);

export type CoreEnv = z.infer<typeof RawCoreEnvSchema>;

export function validateCoreEnv(rawEnv: Record<string, unknown> = process.env): CoreEnv {
  return RawCoreEnvSchema.parse(rawEnv);
}
