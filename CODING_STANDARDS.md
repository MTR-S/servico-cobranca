# Padrões de Código e Convenções de Teste

## 1. Stack e Ferramentas

- **Linguagem:** TypeScript 5+ com modo estrito (`strict: true`) e resolução NodeNext / ES2022.
- **Validação:** Zod para todos os contratos de eventos, DTOs e variáveis de ambiente.
- **Testes:** Vitest em todos os pacotes do monorepo.
- **Gerenciador de Pacotes:** npm workspaces (`workspaces: ["packages/*", "services/*"]`).

## 2. Aritmética Financeira

- **Centavos Inteiros:** Para evitar imprecisões de ponto flutuante IEEE 754, valores monetários transitam em centavos inteiros (`number` inteiro não-negativo).
- **Arredondamento:** A comissão é arredondada para a casa decimal mais próxima utilizando o critério `HALF_UP`:
  $$\text{Comissão} = \text{round}(\text{Total Bruto} \times 0.05)$$
  $$\text{Repasse} = \text{Total Bruto} - \text{Comissão}$$
- **Formatação Monetária:** Exibição no padrão brasileiro: `R$ 2.552,20`.

## 3. Estrutura de Contratos

- Todos os eventos trafegados entre os serviços devem utilizar discriminated unions no Zod com o campo discriminador `type`.
- Todos os contratos de eventos e configurações devem ser centralizados em `@servico-cobranca/contracts`.
- Nenhuma dependência externa pesada (navegadores, bancos de dados, sockets) deve ser adicionada a `packages/contracts`.

## 4. Convenções de Testes

- **Test-Driven Development (TDD):** Ciclo Red $\rightarrow$ Green $\rightarrow$ Refactor para novas funcionalidades e correções de bugs.
- **Testes em Seams Públicas:** Testar comportamentos através de interfaces e seams públicas (`WeeklyClosingEngine`, `MessagingBridge`, validadores de schema), nunca métodos privados.
- **Isolamento de Arquitetura:** Testes automatizados verificam que as fronteiras arquiteturais entre `core`, `messaging` e `contracts` permanecem intactas.
- **Scripts Unificados:**
  - `npm test`: Executa todos os testes do monorepo com Vitest.
  - `npm run build`: Compila todos os pacotes TypeScript.
  - `npm run typecheck`: Executa `tsc --noEmit` em todos os workspaces.
