# 21: Parâmetros do motor configuráveis

**What to build:** Na tela de Configurações, o usuário ajusta os parâmetros do motor: a janela de Respostas recentes do Desempenho, o peso mínimo dos Tópicos fortes, a fração de Revisão da Rodada, o limite de enunciados existentes enviados na geração e o limiar de semelhança de duplicadas. O motor passa a ler esses valores das Configurações em vez dos padrões fixos.

**Blocked by:** 05 (Desempenho e sorteio ponderado), 06 (Revisões com FSRS), 18 (Perguntas sem repetição).

**Status:** ready-for-agent

- [ ] A tela de Configurações mostra os parâmetros com seus valores padrão e permite editá-los com validação de faixa
- [ ] O Desempenho, o sorteio, a composição da Rodada e o filtro de duplicadas usam os valores configurados
- [ ] Testes pela interface do motor cobrem que alterar cada parâmetro muda o comportamento correspondente
