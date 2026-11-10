# Instruções e Regras para Agentes

## 1. Regras de Execução e Trabalho em Issues

- **Escopo Estrito:** Trabalhe exclusivamente na issue designada. Não implemente requisitos de outras issues antes da sua vez.
- **Branches:** Todo trabalho deve ser realizado na branch designada para a issue (ex: `sandcastle/issue-<ID>`), ramificada a partir de `implementation`.
- **Branches Protegidas:** NUNCA altere, faça commits ou envie push direto para branches protegidas: `main`, `master`, `homol`, `developer`, `staging`, `production`.
- **Feedback Loops:** Antes de qualquer commit, execute os comandos de verificação:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  Nunca faça commit de código que não passe na compilação ou na suíte de testes.

## 2. Estrutura do Monorepo

- `packages/contracts`: Schemas Zod de comandos e mensagens, validação de `.env` e constantes de filas.
- `services/core`: Lógica de negócio, scraping Getnet, agendamento e persistência SQLite.
- `services/messaging`: Conexão WhatsApp via Baileys e ponte de mensageria RabbitMQ.

## 3. Padrão de Mensagens de Commit

Todo commit deve seguir o formato:
```
RALPH: [Resumo da tarefa completada + referência da issue/PRD]

Key decisions made:
- [Decisão 1]
- [Decisão 2]

Files changed:
- [Lista de arquivos principais alterados]

Blockers or notes for next iteration:
- [Notas ou None]
```
