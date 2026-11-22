# 06: Revisões com FSRS

**What to build:** Toda Pergunta respondida passa a ser agendada com repetição espaçada (FSRS, via ts-fsrs). Erro ou "Não sei" vira "Errei", acerto em dúvida vira "Difícil" e acerto com certeza vira "Bom". Ao criar uma Rodada, as Revisões vencidas entram primeiro, ocupando até 30% da Rodada, e o resto vem de Perguntas novas. As Alternativas são embaralhadas em cada apresentação. A página do Estudo mostra quantas Revisões estão vencidas hoje, com um atalho para criar uma Rodada. Esta fatia introduz o relógio como porta.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** ready-for-agent

- [ ] Cada Resposta atualiza o estado FSRS da Pergunta com o mapeamento combinado
- [ ] Perguntas anuladas ou arquivadas e Perguntas de Tópicos arquivados não entram em Revisão (respeitar a situação, mesmo que esses estados cheguem em fatias futuras)
- [ ] A composição da Rodada coloca as Revisões vencidas primeiro, até a fração de Revisão (padrão 30%), e completa com Perguntas novas
- [ ] As Alternativas são embaralhadas a cada apresentação, e a correção continua certa depois do embaralhamento
- [ ] A página do Estudo mostra o número de Revisões vencidas e um atalho para criar Rodada
- [ ] O motor usa uma porta de relógio, e os testes avançam o tempo para verificar o vencimento
- [ ] Testes pela interface do motor cobrem o mapeamento para o FSRS, o vencimento ao longo dos dias, o limite de 30% e o embaralhamento
