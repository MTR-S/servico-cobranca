import { z } from 'zod';
import {
  WeeklyClosingReportSchema,
  WeeklyClosingReportMessage,
  TerminalClosingDetailSchema,
  TerminalClosingDetail
} from './weekly-closing-report';
import {
  GroupNoticeSchema,
  GroupNoticeMessage,
  GroupNoticeTypeSchema,
  GroupNoticeType
} from './group-notice';
import {
  AdminTechnicalAlertSchema,
  AdminTechnicalAlertMessage,
  AdminAlertTypeSchema,
  AdminAlertType
} from './admin-technical-alert';

export * from './weekly-closing-report';
export * from './group-notice';
export * from './admin-technical-alert';

export const WhatsappOutboundMessageSchema = z.discriminatedUnion('type', [
  WeeklyClosingReportSchema,
  GroupNoticeSchema,
  AdminTechnicalAlertSchema
]);

export type WhatsappOutboundMessage = z.infer<typeof WhatsappOutboundMessageSchema>;

export function parseWhatsappOutboundMessage(data: unknown): WhatsappOutboundMessage {
  return WhatsappOutboundMessageSchema.parse(data);
}

export function safeParseWhatsappOutboundMessage(data: unknown) {
  return WhatsappOutboundMessageSchema.safeParse(data);
}
