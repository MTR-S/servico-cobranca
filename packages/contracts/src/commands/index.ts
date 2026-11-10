import { z } from 'zod';
import { RequestWeeklyClosingSchema } from './request-weekly-closing';
import { ForceWeeklyClosingSchema } from './force-weekly-closing';
import { ImportFallbackReportSchema } from './import-fallback-report';

export * from './request-weekly-closing';
export * from './force-weekly-closing';
export * from './import-fallback-report';

export const ClosingCommandSchema = z.discriminatedUnion('type', [
  RequestWeeklyClosingSchema,
  ForceWeeklyClosingSchema,
  ImportFallbackReportSchema
]);

export type ClosingCommand = z.infer<typeof ClosingCommandSchema>;

export function parseClosingCommand(data: unknown): ClosingCommand {
  return ClosingCommandSchema.parse(data);
}

export function safeParseClosingCommand(
  data: unknown
): z.SafeParseReturnType<unknown, ClosingCommand> {
  return ClosingCommandSchema.safeParse(data);
}
