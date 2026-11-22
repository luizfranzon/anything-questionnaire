# 17: Contestação

**What to build:** Ao ver a correção de uma Pergunta, o usuário pode contestar o Gabarito escrevendo por que discorda. A reavaliação roda na fila, em duas etapas protegidas contra bajulação (ADR 0002). Primeiro, uma resolução às cegas recebe só o enunciado e as Alternativas, sem o Gabarito nem o argumento. Depois, um juiz (Etapa de julgamento de Contestação) recebe as duas posições anonimizadas (o argumento do usuário e a Explicação original), em ordem que não revela a origem, mais a resolução às cegas e os Trechos relevantes, sem saber que existe uma contestação. Ele decide citando evidência e pode usar busca na web. Desfechos: Gabarito corrigido (a Resposta vira acerto e o Desempenho e o FSRS são recalculados), Gabarito mantido (com justificativa) ou Pergunta anulada (sem evidência suficiente, ou com indicação de uma terceira Alternativa). Enquanto a Contestação está em análise, a Pergunta fica fora das Revisões.

**Blocked by:** 04 (Resolução às cegas na geração).

**Status:** ready-for-agent

- [ ] O usuário contesta uma Pergunta com seu argumento, e a Contestação fica em análise. A Pergunta sai das Revisões enquanto isso
- [ ] A resolução às cegas não recebe o Gabarito, a Explicação nem o argumento do usuário
- [ ] O juiz recebe as posições anonimizadas, em ordem que não revela qual é a do usuário, sem menção a contestação, e precisa citar evidência. A busca na web fica disponível nas duas etapas
- [ ] Corrigido: o Gabarito é atualizado, a Resposta passa a acerto, e o Desempenho e o FSRS são recalculados
- [ ] Mantido: o usuário vê a justificativa
- [ ] Anulado: a Pergunta sai do Desempenho e das Revisões e aparece como anulada no banco de Perguntas
- [ ] O usuário acompanha a situação da Contestação
- [ ] O consumo das duas Etapas é registrado
- [ ] Testes pela interface do motor cobrem os três desfechos e seus efeitos, e verificam pelo gateway falso que nenhuma chamada recebeu informação que identifique a posição do usuário
