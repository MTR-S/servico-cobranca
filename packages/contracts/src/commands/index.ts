import { z } from 'zod';
import { RequestWeeklyClosingSchema, RequestWeeklyClosingCommand } from './request-weekly-closing';
import { ForceWeeklyClosingSchema, ForceWeeklyClosingCommand } from './force-weekly-closing';
import { ImportFallbackReportSchema, ImportFallbackReportCommand } from './import-fallback-report';

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

export function safeParseClosingCommand(data: unknown) {
  return ClosingCommandSchema.safeParse(data);
}
