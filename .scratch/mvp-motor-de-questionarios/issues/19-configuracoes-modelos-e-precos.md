# 19: Configurações: modelos e preços

**What to build:** Uma tela de Configurações permite escolher o modelo do Claude de cada Etapa (extração de Tópicos, classificação de Trechos, geração de Perguntas, resolução às cegas, julgamento de Contestação), com Opus 5.5 como padrão em todas, e editar a tabela de preços por modelo (entrada, saída, leitura e gravação de cache). As chamadas passam a usar o modelo configurado para a sua Etapa.

**Blocked by:** 02 (Proposta e aprovação de Tópicos a partir do Objetivo).

**Status:** ready-for-agent

- [ ] A tela de Configurações lista as Etapas, cada uma com um seletor de modelo (padrão Opus 5.5)
- [ ] O gateway do Claude usa o modelo configurado para cada Etapa, e o registro de consumo guarda o modelo efetivamente usado
- [ ] A tabela de preços por modelo é editável e vem preenchida com os preços atuais dos modelos oferecidos
- [ ] Testes pela interface do motor cobrem a alteração do modelo de uma Etapa (verificada pelo gateway falso) e a edição de preços
