### 1. Objetivo Principal
Automatizar o processo de auditoria e conciliação financeira semanal entre um proprietário de maquininhas de cartão e um comerciante, substituindo a verificação manual no portal da adquirente e padronizando o envio do relatório final no WhatsApp.

### 2. Atores Envolvidos
*   **Elival:** Proprietário das maquininhas de cartão. O dinheiro das vendas cai diretamente na conta bancária vinculada a ele. Ele retém uma comissão pelo empréstimo dos equipamentos.
*   **Ivo:** Comerciante. Pega as maquininhas de Elival emprestadas para realizar as vendas do seu negócio diário.
*   **Maria:** Auditora/Conciliadora. Terceira pessoa responsável por cruzar os dados enviados por Ivo com os dados oficiais da adquirente e calcular o repasse correto.

### 3. Fluxo do Processo
1.  Elival empresta um número **X** de maquininhas para Ivo.
2.  Ivo realiza vendas diárias em seu comércio utilizando as maquininhas de Elival.
3.  Ao final de cada dia, Ivo tira fotos dos extratos impressos pelas maquininhas e envia em um grupo de WhatsApp (onde estão Elival, Ivo e Maria).
4.  Ao final da semana (segunda a domingo), Ivo envia a soma total semanal.
5.  Devido a inconsistências e erros de soma frequentes por parte de Ivo, Maria ignora as somas manuais e acessa diretamente o portal oficial da adquirente como **fonte de verdade**.
6.  Maria extrai o valor real transacionado, calcula a comissão de Elival, subtrai esse valor do total e envia o resumo final no grupo do WhatsApp para aprovação de pagamento.
7.  Elival realiza o pagamento do valor final para Ivo.

### 4. Regras de Negócio e Parâmetros
*   **Fonte de Verdade (Fator de Confiança):** O portal oficial da Getnet (`https://minhaconta.getnet.com.br/login`). Os cálculos de repasse devem ser baseados exclusivamente nos dados extraídos deste site.
*   **Volume de Equipamentos:** Atualmente, Elival empresta **2 maquininhas** (X=2) para Ivo. Em determinados dias, Ivo pode utilizar apenas uma fração desse total.
*   **Tipos de Pagamento:** O extrato contempla transações em Cartão (crédito/débito) e PIX.
*   **Cálculo da Comissão:** Elival tem direito a uma comissão de **5%** aplicada exclusivamente sobre o **"Total Geral Bruto"** do período.
*   **Fórmula de Repasse:** `Valor a Pagar = Total Geral Bruto - (Total Geral Bruto * 0.05)`.

### 5. Formato de Saída (Output Esperado)
Após a análise e cálculo, o sistema/automação deverá gerar e enviar no grupo de WhatsApp uma mensagem seguindo a estrutura abaixo (exemplo com base em um valor bruto de R$ 2.552,20):

> - Valor Bruto = R$2.552,20
> - Comissão (5%) = R$127,61
> - Valor a Pagar = R$2.552,20 - R$127,61 = R$2.424,59