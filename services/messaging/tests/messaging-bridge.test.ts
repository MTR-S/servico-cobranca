import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MessagingBridge,
  PROCESSING_FEEDBACK_MESSAGE,
  normalizeSenderId,
  isSenderAllowed,
  isMatchingGroup,
  isCloseWeekCommand
} from '../src/messaging-bridge';
import {
  MessagingEnv,
  QUEUES,
  RequestWeeklyClosingSchema,
  WeeklyClosingReportMessage,
  GroupNoticeMessage,
  AdminTechnicalAlertMessage
} from '@servico-cobranca/contracts';
import { WhatsAppClient, CommandPublisher, QueueConsumer, WhatsAppIncomingMessage } from '../src/types';

describe('MessagingBridge', () => {
  const mockConfig: MessagingEnv = {
    NODE_ENV: 'test',
    TIMEZONE: 'America/Sao_Paulo',
    RABBITMQ_URL: 'amqp://localhost:5672',
    WHATSAPP_GROUP_ID: '120363021234567890@g.us',
    WHATSAPP_ALLOWED_SENDERS: ['5511999999999', '5511888888888'],
    WHATSAPP_ADMIN_SENDERS: ['5511999999999'],
    WHATSAPP_AUTH_MODE: 'QR_CODE',
    WHATSAPP_SESSION_PATH: './data/whatsapp-session'
  };

  let mockWhatsappClient: WhatsAppClient;
  let mockCommandPublisher: CommandPublisher;

  beforeEach(() => {
    mockWhatsappClient = {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    };
    mockCommandPublisher = {
      publish: vi.fn().mockResolvedValue(undefined)
    };
  });

  describe('Helper unit functions', () => {
    it('normalizes sender IDs across multiple formats', () => {
      expect(normalizeSenderId('5511999999999@s.whatsapp.net')).toBe('5511999999999');
      expect(normalizeSenderId('5511999999999:1@s.whatsapp.net')).toBe('5511999999999');
      expect(normalizeSenderId('+55 11 99999-9999')).toBe('5511999999999');
      expect(normalizeSenderId('admin_user')).toBe('admin_user');
    });

    it('verifies sender authorization against allowed list', () => {
      const allowed = ['5511999999999', '5511888888888'];
      expect(isSenderAllowed('5511999999999@s.whatsapp.net', allowed)).toBe(true);
      expect(isSenderAllowed('5511999999999:2@s.whatsapp.net', allowed)).toBe(true);
      expect(isSenderAllowed('5511888888888', allowed)).toBe(true);
      expect(isSenderAllowed('5511777777777@s.whatsapp.net', allowed)).toBe(false);
      expect(isSenderAllowed('', allowed)).toBe(false);
    });

    it('verifies group matching with and without @g.us', () => {
      expect(isMatchingGroup('120363021234567890@g.us', '120363021234567890@g.us')).toBe(true);
      expect(isMatchingGroup('120363021234567890', '120363021234567890@g.us')).toBe(true);
      expect(isMatchingGroup('999999999999999999@g.us', '120363021234567890@g.us')).toBe(false);
      expect(isMatchingGroup(undefined, '120363021234567890@g.us')).toBe(false);
    });

    it('recognizes Bot/Fechar Semana command case-insensitively and handles whitespace', () => {
      expect(isCloseWeekCommand('Bot/Fechar Semana')).toBe(true);
      expect(isCloseWeekCommand('bot/fechar semana')).toBe(true);
      expect(isCloseWeekCommand('BOT/FECHAR SEMANA')).toBe(true);
      expect(isCloseWeekCommand('  bot/fechar   semana  ')).toBe(true);
      expect(isCloseWeekCommand('Fechar Semana')).toBe(false);
      expect(isCloseWeekCommand('Bot/Outro')).toBe(false);
      expect(isCloseWeekCommand('')).toBe(false);
      expect(isCloseWeekCommand(null)).toBe(false);
    });
  });

  describe('Incoming WhatsApp message handling (Bot/Fechar Semana)', () => {
    it('accepts Bot/Fechar Semana from allowed sender in the configured group, sends feedback and publishes REQUEST_WEEKLY_CLOSING', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const handled = await bridge.handleIncomingMessage({
        groupId: '120363021234567890@g.us',
        senderId: '5511999999999@s.whatsapp.net',
        content: 'Bot/Fechar Semana'
      });

      expect(handled).toBe(true);

      // Verify immediate feedback
      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        PROCESSING_FEEDBACK_MESSAGE
      );

      // Verify command publishing
      expect(mockCommandPublisher.publish).toHaveBeenCalledTimes(1);
      const [queue, command] = (mockCommandPublisher.publish as any).mock.calls[0];
      expect(queue).toBe(QUEUES.CLOSING_COMMANDS);
      expect(command.type).toBe('REQUEST_WEEKLY_CLOSING');
      expect(command.groupId).toBe('120363021234567890@g.us');
      expect(command.senderId).toBe('5511999999999@s.whatsapp.net');
      expect(command.source).toBe('MANUAL_WHATSAPP');
      expect(command.metadata).toEqual({ rawMessage: 'Bot/Fechar Semana' });

      // Validate schema
      const parseResult = RequestWeeklyClosingSchema.safeParse(command);
      expect(parseResult.success).toBe(true);
    });

    it('accepts command case-insensitively (e.g. "bot/fechar semana" and "BOT/FECHAR SEMANA")', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const handledLower = await bridge.handleIncomingMessage({
        groupId: '120363021234567890@g.us',
        senderId: '5511888888888',
        content: 'bot/fechar semana'
      });
      expect(handledLower).toBe(true);

      const handledUpper = await bridge.handleIncomingMessage({
        groupId: '120363021234567890@g.us',
        senderId: '5511888888888',
        content: '   BOT/FECHAR SEMANA   '
      });
      expect(handledUpper).toBe(true);

      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockCommandPublisher.publish).toHaveBeenCalledTimes(2);
    });

    it('resolves remoteJid and participant when groupId and senderId are not explicitly set', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const handled = await bridge.handleIncomingMessage({
        remoteJid: '120363021234567890@g.us',
        participant: '5511999999999:1@s.whatsapp.net',
        content: 'Bot/Fechar Semana',
        metadata: { messageId: 'WA-MSG-001' }
      });

      expect(handled).toBe(true);
      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        '⏳ Processando...'
      );
      expect(mockCommandPublisher.publish).toHaveBeenCalledTimes(1);
      const [, command] = (mockCommandPublisher.publish as any).mock.calls[0];
      expect(command.metadata).toEqual({
        messageId: 'WA-MSG-001',
        rawMessage: 'Bot/Fechar Semana'
      });
    });

    it('ignores Bot/Fechar Semana if sender is NOT in WHATSAPP_ALLOWED_SENDERS', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const handled = await bridge.handleIncomingMessage({
        groupId: '120363021234567890@g.us',
        senderId: '5511777777777@s.whatsapp.net',
        content: 'Bot/Fechar Semana'
      });

      expect(handled).toBe(false);
      expect(mockWhatsappClient.sendMessage).not.toHaveBeenCalled();
      expect(mockCommandPublisher.publish).not.toHaveBeenCalled();
    });

    it('ignores Bot/Fechar Semana if message is sent outside the configured group (e.g. DM or wrong group)', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      // Sent in another group
      const handledOtherGroup = await bridge.handleIncomingMessage({
        groupId: '999999999999999999@g.us',
        senderId: '5511999999999@s.whatsapp.net',
        content: 'Bot/Fechar Semana'
      });
      expect(handledOtherGroup).toBe(false);

      // Sent in direct message (no groupId)
      const handledDM = await bridge.handleIncomingMessage({
        remoteJid: '5511999999999@s.whatsapp.net',
        senderId: '5511999999999@s.whatsapp.net',
        content: 'Bot/Fechar Semana'
      });
      expect(handledDM).toBe(false);

      expect(mockWhatsappClient.sendMessage).not.toHaveBeenCalled();
      expect(mockCommandPublisher.publish).not.toHaveBeenCalled();
    });

    it('ignores regular chat messages in the group', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const conversationalMessages = [
        'Olá pessoal, bom dia!',
        'Marcelo, já enviou as vendas?',
        'Fechar semana',
        'bot fechar semana',
        'Bot/Ajuda',
        'Bot/Forcar Fechamento'
      ];

      for (const content of conversationalMessages) {
        const handled = await bridge.handleIncomingMessage({
          groupId: '120363021234567890@g.us',
          senderId: '5511999999999@s.whatsapp.net',
          content
        });
        expect(handled).toBe(false);
      }

      expect(mockWhatsappClient.sendMessage).not.toHaveBeenCalled();
      expect(mockCommandPublisher.publish).not.toHaveBeenCalled();
    });

    it('handles empty, whitespace-only, or missing content safely without throwing', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      expect(
        await bridge.handleIncomingMessage({
          groupId: '120363021234567890@g.us',
          senderId: '5511999999999@s.whatsapp.net',
          content: ''
        })
      ).toBe(false);

      expect(
        await bridge.handleIncomingMessage({
          groupId: '120363021234567890@g.us',
          senderId: '5511999999999@s.whatsapp.net',
          content: '    '
        })
      ).toBe(false);

      expect(
        await bridge.handleIncomingMessage({
          groupId: '120363021234567890@g.us',
          senderId: '5511999999999@s.whatsapp.net'
        } as WhatsAppIncomingMessage)
      ).toBe(false);

      expect(mockWhatsappClient.sendMessage).not.toHaveBeenCalled();
      expect(mockCommandPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('Outbound message handling (whatsapp.outbound queue)', () => {
    it('dispatches WEEKLY_CLOSING_REPORT to the recipient group', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const reportMessage: WeeklyClosingReportMessage = {
        id: 'rep-123',
        type: 'WEEKLY_CLOSING_REPORT',
        timestamp: '2026-11-07T23:59:00.000Z',
        recipient: '120363021234567890@g.us',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-07',
        closedAt: '2026-11-07T23:59:00.000Z',
        totalGrossAmountInCents: 255220,
        commissionPercentage: 5.0,
        commissionAmountInCents: 12761,
        netTransferAmountInCents: 242459,
        terminals: [
          {
            terminalNumber: '12345678',
            grossAmountInCents: 150000,
            transactionCount: 10
          },
          {
            terminalNumber: '87654321',
            grossAmountInCents: 105220,
            transactionCount: 5
          }
        ],
        formattedMessage:
          '📊 *Fechamento Semanal (01/11 a 07/11)*\n\n* Total Bruto: R$ 2.552,20\n* Comissão (5%): R$ 127,61\n* Repasse Líquido: R$ 2.424,59',
        isReprocessing: false
      };

      await bridge.handleOutboundMessage(reportMessage);

      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        reportMessage.formattedMessage
      );
    });

    it('dispatches GROUP_NOTICE to the recipient', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const noticeMessage: GroupNoticeMessage = {
        id: 'notice-123',
        type: 'GROUP_NOTICE',
        timestamp: '2026-11-08T10:00:00.000Z',
        recipient: '120363021234567890@g.us',
        noticeType: 'OUTSIDE_SATURDAY_REJECTED',
        message: '⚠️ O fechamento semanal padrão só pode ser solicitado aos sábados.'
      };

      await bridge.handleOutboundMessage(noticeMessage);

      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        '⚠️ O fechamento semanal padrão só pode ser solicitado aos sábados.'
      );
    });

    it('dispatches ADMIN_TECHNICAL_ALERT to each administrator recipient with screenshot if present', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      const alertMessage: AdminTechnicalAlertMessage = {
        id: 'alert-123',
        type: 'ADMIN_TECHNICAL_ALERT',
        timestamp: '2026-11-07T22:00:00.000Z',
        recipients: ['5511999999999', '5511888888888'],
        alertType: 'SCRAPING_FAILURE',
        message: '🚨 Falha na extração de vendas da Getnet após 3 tentativas.',
        screenshotPath: '/data/screenshots/error-20261107.png'
      };

      await bridge.handleOutboundMessage(alertMessage);

      expect(mockWhatsappClient.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockWhatsappClient.sendMessage).toHaveBeenNthCalledWith(
        1,
        '5511999999999',
        alertMessage.message,
        { mediaPath: '/data/screenshots/error-20261107.png' }
      );
      expect(mockWhatsappClient.sendMessage).toHaveBeenNthCalledWith(
        2,
        '5511888888888',
        alertMessage.message,
        { mediaPath: '/data/screenshots/error-20261107.png' }
      );
    });

    it('throws validation error when receiving an invalid outbound message', async () => {
      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: mockWhatsappClient,
        commandPublisher: mockCommandPublisher
      });

      await expect(
        bridge.handleOutboundMessage({
          type: 'INVALID_TYPE',
          foo: 'bar'
        })
      ).rejects.toThrow();

      expect(mockWhatsappClient.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle wiring (start & stop)', () => {
    it('registers onMessage on whatsappClient and consume on queueConsumer when start() is called', async () => {
      let registeredIncomingHandler: ((msg: WhatsAppIncomingMessage) => Promise<void>) | undefined;
      let registeredQueueHandler: ((msg: unknown) => Promise<void>) | undefined;

      const clientWithListener: WhatsAppClient = {
        sendMessage: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn((handler) => {
          registeredIncomingHandler = handler;
        })
      };

      const mockQueueConsumer: QueueConsumer = {
        consume: vi.fn(async (queue, handler) => {
          if (queue === QUEUES.WHATSAPP_OUTBOUND) {
            registeredQueueHandler = handler;
          }
        })
      };

      const bridge = new MessagingBridge({
        config: mockConfig,
        whatsappClient: clientWithListener,
        commandPublisher: mockCommandPublisher,
        queueConsumer: mockQueueConsumer
      });

      await bridge.start();

      expect(clientWithListener.onMessage).toHaveBeenCalledTimes(1);
      expect(mockQueueConsumer.consume).toHaveBeenCalledTimes(1);
      expect(mockQueueConsumer.consume).toHaveBeenCalledWith(
        QUEUES.WHATSAPP_OUTBOUND,
        expect.any(Function)
      );

      // Verify wired incoming message handler
      expect(registeredIncomingHandler).toBeDefined();
      await registeredIncomingHandler!({
        groupId: '120363021234567890@g.us',
        senderId: '5511999999999',
        content: 'Bot/Fechar Semana'
      });
      expect(clientWithListener.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        '⏳ Processando...'
      );

      // Verify wired outbound queue handler
      expect(registeredQueueHandler).toBeDefined();
      await registeredQueueHandler!({
        id: 'notice-start-test',
        type: 'GROUP_NOTICE',
        timestamp: '2026-11-08T10:00:00.000Z',
        recipient: '120363021234567890@g.us',
        noticeType: 'GENERIC_NOTICE',
        message: 'Aviso via fila'
      });
      expect(clientWithListener.sendMessage).toHaveBeenCalledWith(
        '120363021234567890@g.us',
        'Aviso via fila'
      );
    });
  });
});
