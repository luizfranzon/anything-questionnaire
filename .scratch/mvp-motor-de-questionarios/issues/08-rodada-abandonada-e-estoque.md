# 08: Rodada abandonada, retomada e Estoque

**What to build:** Se o usuário sai no meio de uma Rodada, a página do Estudo mostra "Rodada em andamento: 8/20" com um botão para continuar de onde parou. Criar uma Rodada nova encerra a que estava em andamento: as Perguntas novas não respondidas vão para o Estoque, sem contar como erro, e as Revisões não apresentadas mantêm o agendamento. Ao compor uma Rodada, as Perguntas do Estoque dos Tópicos sorteados entram antes de se gerarem Perguntas novas.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** ready-for-agent

- [ ] A página do Estudo mostra a Rodada em andamento com o progresso e permite retomá-la na próxima Pergunta não respondida
- [ ] Criar uma Rodada nova encerra a anterior. As Perguntas não respondidas não geram Resposta e não contam no Desempenho
- [ ] As Perguntas novas nunca apresentadas formam o Estoque
- [ ] A composição usa as Perguntas do Estoque dos Tópicos sorteados antes de pedir Perguntas novas ao Claude, e só gera o que faltar
- [ ] Testes pela interface do motor cobrem a retomada, o encerramento, a ida para o Estoque e o consumo do Estoque na Rodada seguinte (verificando pelo gateway falso que menos Perguntas foram pedidas)
