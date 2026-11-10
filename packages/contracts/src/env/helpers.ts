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
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return NaN;
    return parsed;
  })
  .pipe(
    z
      .number()
      .positive('Value must be a positive number')
      .max(100, 'Commission percentage must not exceed 100%')
  );
