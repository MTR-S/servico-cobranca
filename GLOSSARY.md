# Conciliação e Repasse de Terminais

Automatiza a apuração semanal das vendas realizadas em terminais de pagamento emprestados pelo Titular ao Comerciante, calculando a comissão retida e o valor líquido de repasse.

## Language

**Titular**:
Proprietário da conta junto à adquirente e dos terminais de pagamento, que recebe a liquidação bancária das vendas e retém a comissão acordada.
_Avoid_: Proprietário, Dono, Locador

**Comerciante**:
Parceiro que utiliza os terminais emprestados pelo Titular em seu negócio diário e tem direito ao repasse semanal das vendas.
_Avoid_: Lojista, Cliente, Usuário

**Conciliador**:
Pessoa responsável por auditar e acompanhar o fechamento semanal entre o Titular e o Comerciante.
_Avoid_: Auditora, Operadora

**Terminal**:
Equipamento físico de captura de transações (POS) vinculado à conta do Titular na adquirente e identificado por um número de terminal único.
_Avoid_: Maquininha, Equipamento, Dispositivo

**Período de Apuração**:
Ciclo semanal que se inicia no domingo (`00:00:00`) e se encerra no sábado no momento do fechamento (acionado manualmente pelo Comerciante ou automaticamente às `23:59:59`).
_Avoid_: Semana, Ciclo

**Fechamento Semanal**:
Ato que encerra um Período de Apuração no sábado, consolida o Total Geral Bruto, a Comissão e o Repasse daquela semana e registra o resultado no histórico.
_Avoid_: Conciliação, Relatório

**Total Geral Bruto**:
Soma do valor original de todas as transações aprovadas (Cartão de Crédito, Débito e PIX) nos Terminais do Comerciante dentro do Período de Apuração, excluindo vendas canceladas ou estornadas e sem descontar taxas da adquirente.
_Avoid_: Valor total, Faturamento, Soma semanal

**Comissão**:
Valor retido pelo Titular aplicado percentual e exclusivamente sobre o Total Geral Bruto (atualmente 5%) pelo empréstimo dos Terminais.
_Avoid_: Taxa, Desconto, Aluguel

**Repasse**:
Valor final a pagar pelo Titular ao Comerciante após subtrair a Comissão do Total Geral Bruto.
_Avoid_: Pagamento, Valor líquido da adquirente
