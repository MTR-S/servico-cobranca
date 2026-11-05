### 1. Objetivo Principal

Automatizar o processo de auditoria e conciliação financeira semanal entre um proprietário de maquininhas de cartão e um comerciante, substituindo a verificação manual no portal da adquirente e padronizando o envio do relatório final no WhatsApp.

### 2. Atores Envolvidos

* **João:** Proprietário das maquininhas de cartão. O dinheiro das vendas cai diretamente na conta bancária vinculada a ele. Ele retém uma comissão pelo empréstimo dos equipamentos.

* **Marcelo:** Comerciante. Pega as maquininhas de João emprestadas para realizar as vendas do seu negócio diário.

* **Joana:** Auditora/Conciliadora. Terceira pessoa responsável por cruzar os dados enviados por Marcelo com os dados oficiais da adquirente e calcular o repasse correto.

### 3. Fluxo do Processo

1. João empresta um número **X** de maquininhas para Marcelo.

2. Marcelo realiza vendas diárias em seu comércio utilizando as maquininhas de João.

3. Ao final de cada dia, Marcelo tira fotos dos extratos impressos pelas maquininhas e envia em um grupo de WhatsApp (onde estão João, Marcelo e Joana).

4. Ao final da semana (segunda a domingo), Marcelo envia a soma total semanal.

5. Devido a inconsistências e erros de soma frequentes por parte de Marcelo, Joana ignora as somas manuais e acessa diretamente o portal oficial da adquirente como **fonte de verdade**.

6. Joana extrai o valor real transacionado, calcula a comissão de João, subtrai esse valor do total e envia o resumo final no grupo do WhatsApp para aprovação de pagamento.

7. João realiza o pagamento do valor final para Marcelo.

### 4. Regras de Negócio e Parâmetros

* **Fonte de Verdade (Fator de Confiança):** O portal oficial da Getnet (`https://minhaconta.getnet.com.br/login`). Os cálculos de repasse devem ser baseados exclusivamente nos dados extraídos deste site.

* **Volume de Equipamentos:** Atualmente, João empresta **2 maquininhas** (X=2) para Marcelo. Em determinados dias, Marcelo pode utilizar apenas uma fração desse total.

* **Tipos de Pagamento:** O extrato contempla transações em Cartão (crédito/débito) e PIX.

* **Cálculo da Comissão:** João tem direito a uma comissão de **5%** aplicada exclusivamente sobre o **"Total Geral Bruto"** do período.

* **Fórmula de Repasse:** `Valor a Pagar = Total Geral Bruto - (Total Geral Bruto * 0.05)`.

### 5. Formato de Saída (Output Esperado)

Após a análise e cálculo, o sistema/automação deverá gerar e enviar no grupo de WhatsApp uma mensagem seguindo a estrutura abaixo (exemplo com base em um valor bruto de R\$ 2.552,20):

> * Valor Bruto  = R\$2.552,20
>
> * Comissão (5%) = R\$127,61
>
> * Valor a Pagar = R\$2.552,20 - R\$127,61 = R\$2.424,59
