# 04: Resolução às cegas na geração

**What to build:** Antes de uma Rodada ficar pronta, cada lote de Perguntas geradas passa por uma resolução às cegas: uma chamada separada (Etapa de resolução às cegas) recebe só os enunciados e as Alternativas, sem os Gabaritos, e resolve tudo num único pedido. Perguntas em que a resposta às cegas não bate com o Gabarito são descartadas e geradas de novo, até a Rodada atingir a quantidade pedida. Veja o ADR 0002.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** done

- [ ] A resolução às cegas recebe só enunciados e Alternativas, nunca os Gabaritos nem as Explicações
- [ ] O lote inteiro é resolvido numa única chamada
- [ ] Perguntas reprovadas são descartadas e substituídas por Perguntas novas, que também passam pela verificação
- [ ] A Rodada só fica pronta com a quantidade pedida de Perguntas aprovadas, e há um limite de tentativas que encerra com erro claro em vez de laço infinito
- [ ] O consumo da Etapa de resolução às cegas é registrado
- [ ] Testes pela interface do motor cobrem a aprovação, o descarte com substituição e o limite de tentativas, e verificam pelo gateway falso que a chamada não recebeu os Gabaritos
