# Contexto do Domínio e Arquitetura do Sistema

## 1. Visão Geral do Sistema

O **Serviço de Cobrança e Fechamento Semanal** automatiza o processo de conciliação financeira semanal entre um Titular de maquininhas de cartão (POS) e um Comerciante. O sistema extrai dados oficiais de vendas da adquirente Getnet como fonte única da verdade, calcula a comissão retida pelo Titular (5%) e o repasse devido ao Comerciante, e publica o demonstrativo formatado em um grupo de WhatsApp.

## 2. Glossário Canônico do Domínio

- **Titular (João):** Proprietário legal dos terminais POS cadastrados na adquirente Getnet. O dinheiro das vendas é creditado em sua conta bancária. Retém comissão acordada (5%) pelo empréstimo dos equipamentos.
- **Comerciante (Marcelo):** Lojista que utiliza os terminais POS do Titular para registrar as vendas diárias do seu comércio.
- **Conciliador / Auditor (Joana):** Responsável por auditar os valores, gerenciar exceções ou fallbacks e confirmar a execução dos fechamentos.
- **Terminal (POS):** Equipamento físico de captura de pagamento identificado por seu número de série. Múltiplos terminais podem estar alocados ao comerciante.
- **Período de Apuração:** Intervalo semanal que se inicia no Domingo às 00:00:00 e encerra no Sábado no momento da solicitação de fechamento (ou 23:59:59 pelo cron automático).
- **Total Geral Bruto:** Soma de todas as transações com status aprovado/confirmado nas modalidades Crédito, Débito e PIX pelo valor facial original (sem dedução de taxas da adquirente). Transações canceladas, negadas ou estornadas são estritamente excluídas.
- **Comissão (5%):** Retenção do Titular calculada como `Total Geral Bruto * 0.05` com arredondamento financeiro `HALF_UP`.
- **Repasse Líquido:** Valor final devido ao Comerciante, calculado como `Total Geral Bruto - Comissão`.

## 3. Arquitetura em Monorepo e Fronteiras de Microsserviços

O sistema é estruturado como um monorepo em TypeScript composto por 3 pacotes sob npm workspaces:

1. **`packages/contracts` (`@servico-cobranca/contracts`):**
   - Biblioteca compartilhada com schemas de validação Zod, tipos estáticos e utilitários de contrato.
   - Define os eventos das filas RabbitMQ (`closing.commands` e `whatsapp.outbound`).
   - Define a validação estrita de variáveis de ambiente (`CoreEnv`, `MessagingEnv`, `AppEnv`).
   - Não possui acoplamento com navegadores, bancos de dados ou bibliotecas de mensageria.

2. **`services/core` (`@servico-cobranca/core`):**
   - Detentor do modelo de domínio, cálculo financeiro, máquina de estados de fechamento e agendamento semanal (`node-cron`).
   - Persistência de histórico e auditoria em SQLite (`fechamentos_semanais`, `fechamento_terminais`, `logs_execucao_auditoria`).
   - Adaptadores de extração Getnet: Playwright real, Fallback de planilha (CSV/XLSX) e modo Mock.
   - **Isolamento estrito:** Não possui qualquer dependência ou código do ecossistema WhatsApp (Baileys).

3. **`services/messaging` (`@servico-cobranca/messaging`):**
   - Adaptador WebSocket do WhatsApp utilizando Baileys com persistência de sessão.
   - Validação de autorização de mensagens recebidas (grupo configurado e remetentes autorizados).
   - Publicação de comandos na fila `closing.commands` e consumo de notificações da fila `whatsapp.outbound`.
   - **Isolamento estrito:** Não possui dependências de Playwright ou bancos de domínio.

## 4. Topologia RabbitMQ

- `closing.commands`: Mensageria $\rightarrow$ Core. Comandos suportados:
  - `REQUEST_WEEKLY_CLOSING`
  - `FORCE_WEEKLY_CLOSING`
  - `IMPORT_FALLBACK_REPORT`
- `whatsapp.outbound`: Core $\rightarrow$ Mensageria. Notificações suportadas:
  - `WEEKLY_CLOSING_REPORT`
  - `GROUP_NOTICE`
  - `ADMIN_TECHNICAL_ALERT`
- Cada fila possui sua respectiva Dead-Letter Queue (DLQ) com confirmação manual (`manual ack`).
