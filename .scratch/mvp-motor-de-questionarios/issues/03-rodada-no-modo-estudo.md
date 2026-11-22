# 03: Rodada no modo estudo

**What to build:** Num Estudo com Tópicos aprovados, o usuário cria uma Rodada informando a quantidade de Perguntas. O Claude (Etapa de geração de Perguntas) gera Perguntas de múltipla escolha em português, com Alternativas, Gabarito, Explicação e Tópico, distribuídas igualmente entre os Tópicos ativos e complementadas pelo conhecimento do Claude. A geração roda na fila, com tela de progresso, e a Rodada só começa quando está toda pronta. O usuário responde escolhendo uma Alternativa ou "Não sei" e informa a Confiança (certeza ou dúvida). No modo estudo, vê na hora se acertou, o Gabarito e a Explicação. No fim, vê o resultado da Rodada. O modelo de dados da Pergunta já comporta o formato de resposta aberta, mesmo que só a múltipla escolha seja gerada.

**Blocked by:** 02 (Proposta e aprovação de Tópicos a partir do Objetivo).

**Status:** ready-for-agent

- [ ] Criar uma Rodada com quantidade enfileira a geração, a tela mostra o progresso, e a Rodada fica pronta só quando atinge a quantidade pedida
- [ ] As Perguntas são distribuídas igualmente entre os Tópicos ativos e vêm em português, cada uma com Alternativas, Gabarito, Explicação (por que a certa é certa e por que cada errada é errada) e Tópico
- [ ] A Pergunta tem um formato (múltipla escolha agora) e o resultado da Resposta é modelado para comportar a resposta aberta no futuro
- [ ] O usuário responde com uma Alternativa ou "Não sei" e informa a Confiança depois de acertar
- [ ] A Resposta é gravada assim que é dada, com resultado, Confiança e data. "Não sei" conta como erro
- [ ] No modo estudo, o resultado, o Gabarito e a Explicação aparecem logo após cada Resposta
- [ ] A tela de resultado mostra acertos/total ao fim da Rodada
- [ ] Testes pela interface do motor cobrem a geração (gateway falso), a distribuição entre Tópicos, o registro de Respostas com Confiança e "Não sei", e o resultado da Rodada
