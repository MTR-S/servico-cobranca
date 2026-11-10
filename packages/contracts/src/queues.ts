export const QUEUES = {
  CLOSING_COMMANDS: 'closing.commands',
  CLOSING_COMMANDS_DLQ: 'closing.commands.dlq',
  WHATSAPP_OUTBOUND: 'whatsapp.outbound',
  WHATSAPP_OUTBOUND_DLQ: 'whatsapp.outbound.dlq'
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
