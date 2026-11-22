# 05: Desempenho e sorteio ponderado

**What to build:** A página do Estudo passa a listar os Tópicos ordenados do mais fraco para o mais forte, cada um com a barra de Desempenho, a tendência (subindo ou caindo nas últimas Rodadas) e o número de Respostas. O Desempenho é calculado sobre as Respostas recentes (padrão: últimas 10 por Tópico), e um acerto em dúvida vale menos que um acerto com certeza. Ao criar uma Rodada, as Perguntas novas são sorteadas por Tópico com pesos: Tópicos fracos têm mais peso, Tópicos nunca perguntados têm prioridade e todo Tópico ativo tem um peso mínimo (padrão 10%). A Dificuldade de cada Pergunta é definida pelo Desempenho do Tópico. A criação de Rodada ganha um filtro opcional de Tópicos.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** ready-for-agent

- [ ] O Desempenho por Tópico considera só as Respostas recentes, dá peso menor ao acerto em dúvida e conta "Não sei" como erro
- [ ] A página do Estudo lista os Tópicos do mais fraco ao mais forte, com Desempenho, tendência e número de Respostas
- [ ] O sorteio das Perguntas novas prioriza os Tópicos nunca perguntados, dá mais peso aos fracos e garante o peso mínimo para todo Tópico ativo
- [ ] A Dificuldade enviada à geração sobe em Tópicos com Desempenho alto, e cada Pergunta guarda sua Dificuldade
- [ ] O filtro opcional de Tópicos restringe o sorteio aos Tópicos escolhidos (padrão: todos)
- [ ] Os valores padrão (janela 10, peso mínimo 10%) ficam centralizados para depois virarem Configurações
- [ ] Testes pela interface do motor cobrem o cálculo do Desempenho (janela, Confiança, "Não sei"), a tendência, a prioridade dos nunca perguntados, o peso mínimo e o filtro. Usar uma fonte de aleatoriedade controlável nos testes
