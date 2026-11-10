import { MessagingEnv, ClosingCommand, WhatsappOutboundMessage } from '@servico-cobranca/contracts';

export interface WhatsAppSendMessageOptions {
  mediaPath?: string;
  caption?: string;
}

export interface WhatsAppIncomingMessage {
  id?: string;
  groupId?: string;
  remoteJid?: string;
  senderId?: string;
  participant?: string;
  content?: string;
  timestamp?: string | number | Date;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppClient {
  sendMessage(
    recipient: string,
    message: string,
    options?: WhatsAppSendMessageOptions
  ): Promise<void>;
  onMessage?(
    handler: (message: WhatsAppIncomingMessage) => Promise<unknown> | unknown
  ): void;
}

export interface CommandPublisher {
  publish<T extends ClosingCommand = ClosingCommand>(
    queue: string,
    command: T
  ): Promise<void>;
}

export interface QueueConsumer {
  consume<T = unknown>(
    queue: string,
    handler: (message: T) => Promise<void>
  ): Promise<void>;
}

export interface MessagingBridgeOptions {
  config: MessagingEnv;
  whatsappClient: WhatsAppClient;
  commandPublisher: CommandPublisher;
  queueConsumer?: QueueConsumer;
}
