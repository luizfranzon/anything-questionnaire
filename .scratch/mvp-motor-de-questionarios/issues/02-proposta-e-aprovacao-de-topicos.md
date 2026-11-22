# 02: Proposta e aprovação de Tópicos a partir do Objetivo

**What to build:** Depois de criar um Estudo só com Objetivo, o usuário pede a proposta de Tópicos. O Claude (Etapa de extração de Tópicos) devolve uma lista, que o usuário revisa (renomeia, junta, apaga, adiciona) e aprova. A proposta roda em segundo plano, numa fila persistida no Postgres (pg-boss), e a tela mostra o progresso. Esta fatia introduz o gateway do Claude como porta, com um adaptador real (Anthropic SDK, Messages API, saída estruturada validada por schema, modelo padrão Opus 5.5) e um falso com respostas roteirizadas por Etapa, além do registro de consumo de cada chamada.

**Blocked by:** 01 (Esqueleto e Estudos).

**Status:** done

- [x] O motor tem uma porta de gateway do Claude com uma operação por Etapa. O adaptador real usa a Messages API com saída estruturada (sem forçar o uso de ferramenta nem prefill)
- [x] O adaptador falso permite roteirizar respostas e simular erro de sobrecarga
- [x] Pedir a proposta enfileira um trabalho no pg-boss. Falhas passageiras são tentadas de novo automaticamente, e o status do trabalho é consultável
- [x] A tela mostra o progresso enquanto a proposta é gerada e continua funcionando se o usuário fechar e reabrir a aba
- [x] O usuário edita a proposta e aprova. Só os Tópicos aprovados ficam no Estudo
- [x] Cada chamada ao Claude grava um registro de consumo com Etapa, modelo, Estudo, tokens de entrada, de saída, lidos do cache e gravados no cache, e data
- [x] Testes pela interface do motor (com o gateway falso) cobrem a proposta, a aprovação com edições, a nova tentativa após falha e o registro de consumo
