# 16: Gestão de Tópicos

**What to build:** Na página do Estudo, o usuário renomeia, junta, arquiva e reativa Tópicos. Renomear mantém todo o histórico. Juntar move Perguntas, vínculos de Trechos e Respostas para o Tópico de destino, e o Desempenho passa a refletir o histórico somado. Arquivar tira o Tópico e suas Perguntas das Rodadas e das Revisões sem apagar nada. Reativar reverte o arquivamento.

**Blocked by:** 05 (Desempenho e sorteio ponderado).

**Status:** ready-for-agent

- [ ] Renomear mantém Perguntas, Trechos, Respostas e Desempenho
- [ ] Juntar move tudo para o Tópico de destino, remove o Tópico de origem, e o Desempenho do destino reflete o histórico somado
- [ ] Um Tópico arquivado não entra no sorteio, nas Revisões nem no filtro de criação de Rodada, mas aparece no banco de Perguntas e no histórico
- [ ] Reativar devolve o Tópico ao sorteio e às Revisões
- [ ] Testes pela interface do motor cobrem cada operação e seus efeitos no Desempenho, no sorteio e nas Revisões
