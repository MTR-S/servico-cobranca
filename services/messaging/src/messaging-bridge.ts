import { randomUUID } from 'crypto';
import {
  MessagingEnv,
  QUEUES,
  RequestWeeklyClosingCommand,
  parseWhatsappOutboundMessage,
  WhatsappOutboundMessage
} from '@servico-cobranca/contracts';
import {
  WhatsAppClient,
  CommandPublisher,
  QueueConsumer,
  WhatsAppIncomingMessage,
  MessagingBridgeOptions
} from './types';

export const PROCESSING_FEEDBACK_MESSAGE = '⏳ Processando...';

export function normalizeSenderId(senderId: string): string {
  const withoutJid = senderId.split('@')[0];
  const withoutDevice = withoutJid.split(':')[0];
  const digitsOnly = withoutDevice.replace(/\D/g, '');
  return digitsOnly.length > 0 ? digitsOnly : withoutDevice.trim().toLowerCase();
}

export function isSenderAllowed(
  senderId: string,
  allowedSenders: string[]
): boolean {
  if (!senderId) return false;
  const normalizedIncoming = normalizeSenderId(senderId);

  return allowedSenders.some((allowed) => {
    if (allowed === senderId) return true;
    const normalizedAllowed = normalizeSenderId(allowed);
    return normalizedIncoming === normalizedAllowed;
  });
}

export function isMatchingGroup(
  incomingGroupId: string | undefined,
  configuredGroupId: string
): boolean {
  if (!incomingGroupId || !configuredGroupId) return false;
  if (incomingGroupId === configuredGroupId) return true;

  const normIncoming = incomingGroupId.replace(/@g\.us$/, '').trim();
  const normConfigured = configuredGroupId.replace(/@g\.us$/, '').trim();
  return normIncoming === normConfigured;
}

export function isCloseWeekCommand(text?: string | null): boolean {
  if (!text) return false;
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized === 'bot/fechar semana';
}

export class MessagingBridge {
  private readonly config: MessagingEnv;
  private readonly whatsappClient: WhatsAppClient;
  private readonly commandPublisher: CommandPublisher;
  private readonly queueConsumer?: QueueConsumer;

  constructor(options: MessagingBridgeOptions) {
    this.config = options.config;
    this.whatsappClient = options.whatsappClient;
    this.commandPublisher = options.commandPublisher;
    this.queueConsumer = options.queueConsumer;
  }

  async handleIncomingMessage(
    message: WhatsAppIncomingMessage
  ): Promise<boolean> {
    const content = message.content?.trim();
    if (!content) {
      return false;
    }

    if (!isCloseWeekCommand(content)) {
      return false;
    }

    const groupId =
      message.groupId ??
      (message.remoteJid?.endsWith('@g.us') ? message.remoteJid : undefined);

    if (!isMatchingGroup(groupId, this.config.WHATSAPP_GROUP_ID)) {
      return false;
    }

    const senderId =
      message.senderId ?? message.participant ?? message.remoteJid ?? '';

    if (!isSenderAllowed(senderId, this.config.WHATSAPP_ALLOWED_SENDERS)) {
      return false;
    }

    const targetGroupId = this.config.WHATSAPP_GROUP_ID;

    // 1. Send immediate feedback in the group
    await this.whatsappClient.sendMessage(
      targetGroupId,
      PROCESSING_FEEDBACK_MESSAGE
    );

    // 2. Publish REQUEST_WEEKLY_CLOSING command to closing.commands queue
    const command: RequestWeeklyClosingCommand = {
      id: randomUUID(),
      type: 'REQUEST_WEEKLY_CLOSING',
      timestamp: new Date().toISOString(),
      groupId: targetGroupId,
      senderId,
      source: 'MANUAL_WHATSAPP',
      metadata: {
        ...(message.metadata ?? {}),
        rawMessage: message.content
      }
    };

    await this.commandPublisher.publish(QUEUES.CLOSING_COMMANDS, command);

    return true;
  }

  async handleOutboundMessage(rawMessage: unknown): Promise<void> {
    const message: WhatsappOutboundMessage =
      parseWhatsappOutboundMessage(rawMessage);

    switch (message.type) {
      case 'WEEKLY_CLOSING_REPORT': {
        await this.whatsappClient.sendMessage(
          message.recipient,
          message.formattedMessage
        );
        break;
      }
      case 'GROUP_NOTICE': {
        await this.whatsappClient.sendMessage(
          message.recipient,
          message.message
        );
        break;
      }
      case 'ADMIN_TECHNICAL_ALERT': {
        for (const recipient of message.recipients) {
          await this.whatsappClient.sendMessage(recipient, message.message, {
            mediaPath: message.screenshotPath
          });
        }
        break;
      }
    }
  }

  async start(): Promise<void> {
    if (this.whatsappClient.onMessage) {
      this.whatsappClient.onMessage(async (msg) => {
        await this.handleIncomingMessage(msg);
      });
    }

    if (this.queueConsumer) {
      await this.queueConsumer.consume(
        QUEUES.WHATSAPP_OUTBOUND,
        async (rawMessage) => {
          await this.handleOutboundMessage(rawMessage);
        }
      );
    }
  }

  async stop(): Promise<void> {
    // Teardown / cleanup if needed
  }
}
