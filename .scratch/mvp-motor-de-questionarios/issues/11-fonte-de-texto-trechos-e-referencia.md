# 11: Fonte de texto, Trechos e referência na Explicação

**What to build:** O usuário adiciona uma Fonte a um Estudo colando um texto ou enviando um arquivo TXT ou Markdown. A Fonte é processada na fila: o conteúdo é capturado uma vez e dividido em Trechos, o Claude propõe só os Tópicos novos para o usuário aprovar (Etapa de extração de Tópicos, agora considerando as Fontes e o que o assunto cobra além delas), e o Claude marca cada Trecho com os Tópicos a que pertence (Etapa de classificação de Trechos). A aprovação de um Tópico novo reclassifica os Trechos. Na geração, cada Tópico sorteado leva seus Trechos, e o Claude complementa com o próprio conhecimento e pode corrigir a Fonte quando ela estiver errada. A Explicação mostra de qual Fonte e Trecho a Pergunta veio, ou indica "conhecimento geral do Claude", e o Trecho abre com um clique. Veja o ADR 0001.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** ready-for-agent

- [ ] O usuário adiciona uma Fonte de texto colado, TXT ou MD, e a tela mostra a lista de Fontes com a situação do processamento
- [ ] Uma porta de captura de Fontes isola a extração, com um adaptador falso para os testes
- [ ] O conteúdo vira Trechos com localização quando houver
- [ ] A proposta de Tópicos num Estudo existente sugere só os Tópicos novos, inclusive os que o assunto cobra mas a Fonte não cobre
- [ ] A classificação marca cada Trecho com zero ou mais Tópicos aprovados e é refeita quando um Tópico novo é aprovado
- [ ] A geração envia os Trechos dos Tópicos sorteados, instrui o Claude a complementar com o próprio conhecimento e a avisar na Explicação quando o Gabarito diverge da Fonte, e grava os Trechos de origem de cada Pergunta
- [ ] O prompt da geração é montado com o conteúdo estável primeiro, para aproveitar o prompt caching
- [ ] A Explicação mostra a referência (Fonte e localização) ou "conhecimento geral do Claude", e um clique abre o Trecho
- [ ] Testes pela interface do motor cobrem a ingestão, a proposta incremental, a classificação e a reclassificação, os Trechos enviados à geração (verificados pelo gateway falso) e o vínculo entre Pergunta e Trecho
