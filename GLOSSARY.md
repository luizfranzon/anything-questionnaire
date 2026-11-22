# Anything Questionnaire

Motor pessoal de questionários: gera perguntas sobre um assunto a partir de fontes fornecidas e reforça os pontos fracos com base no histórico de acertos e erros.

## Language

**Estudo**:
O assunto que se está estudando, que agrupa suas Fontes, Rodadas e o desempenho acumulado. Todo aprendizado sobre pontos fracos fica restrito a um Estudo.
_Avoid_: Tema, assunto, projeto, curso

**Tópico**:
Uma subdivisão de um Estudo à qual cada Pergunta pertence. É a unidade em que se mede o desempenho. Existe só dentro do seu Estudo, faz parte de uma lista fechada aprovada pelo usuário e é reaproveitado entre Rodadas. Um Tópico pode ser renomeado, juntado a outro (somando o histórico dos dois) ou arquivado. Um **Tópico arquivado** sai das Rodadas, mas seu histórico é mantido.
_Avoid_: Tema, tag, categoria, assunto

**Objetivo**:
A descrição, em linguagem natural, do que se quer estudar num Estudo. Basta sozinho para gerar Perguntas a partir do conhecimento do Claude.
_Avoid_: Prompt, descrição

**Desempenho**:
A medida de quanto o usuário domina um Tópico, calculada sobre as Respostas mais recentes. Tópicos com Desempenho baixo recebem mais Perguntas novas, Tópicos nunca perguntados têm prioridade e Tópicos fortes continuam aparecendo com um peso mínimo.
_Avoid_: Score, nota, aproveitamento, domínio

**Fonte**:
Material opcional fornecido a um Estudo (texto, arquivo ou site) que serve de foco para a geração de Perguntas, sempre complementado pelo conhecimento do Claude. Não é autoridade absoluta: quando o Claude julga que a Fonte está errada ou desatualizada, prevalece o que ele considera correto. Seu conteúdo é capturado uma única vez, ao ser adicionado.
_Avoid_: Material, input, documento

**Trecho**:
Um pedaço do conteúdo de uma Fonte, marcado com os Tópicos a que pertence. Um Tópico pode não ter nenhum Trecho.
_Avoid_: Chunk, fragmento, passagem

**Rodada**:
Uma sessão de perguntas geradas dentro de um Estudo, com a quantidade pedida, um Modo e, opcionalmente, um subconjunto dos Tópicos do Estudo.
_Avoid_: Quiz, questionário, sessão, teste

**Modo**:
Como a correção é mostrada numa Rodada: no **modo estudo**, logo após cada Resposta; no **modo simulado**, só ao final da Rodada.
_Avoid_: Tipo de rodada

**Estoque**:
As Perguntas já geradas e verificadas que o usuário nunca viu (por exemplo, sobras de uma Rodada abandonada). Entram nas Rodadas seguintes antes de se gerarem Perguntas novas.
_Avoid_: Fila, pool, reserva

**Pergunta**:
Um item gerado numa Rodada, pertencente a um Tópico, cuja resposta conta como acerto ou erro. Tem um formato: múltipla escolha (com Alternativas e um Gabarito) ou resposta aberta. Sabe de quais Fontes foi gerada. Pode estar ativa, anulada ou arquivada (fora das Rodadas e do Desempenho, com o histórico mantido).
_Avoid_: Questão, item

**Dificuldade**:
O nível de exigência de uma Pergunta, escolhido pelo motor: Tópicos com Desempenho alto recebem Perguntas mais difíceis.
_Avoid_: Nível, complexidade

**Alternativa**:
Uma das opções apresentadas numa Pergunta de múltipla escolha.
_Avoid_: Opção, escolha

**Gabarito**:
A resposta correta de uma Pergunta: a Alternativa certa ou, em resposta aberta, a resposta esperada.
_Avoid_: Resposta certa, solução

**Explicação**:
O texto que acompanha o Gabarito de uma Pergunta e justifica por que a resposta certa é certa e por que as demais estão erradas.
_Avoid_: Justificativa, comentário, feedback

**Revisão**:
Uma Pergunta já respondida, acertada ou errada, que volta numa Rodada posterior quando sua repetição espaçada vence. Ocupa no máximo uma fração da Rodada, e o resto são Perguntas inéditas.
_Avoid_: Repetição, retry

**Contestação**:
O pedido do usuário para reavaliar o Gabarito de uma Pergunta, com seu argumento. Termina de uma de três formas: Gabarito mantido, Gabarito corrigido (e a Resposta reavaliada) ou Pergunta anulada.
_Avoid_: Disputa, reclamação, recurso

**Pergunta anulada**:
Uma Pergunta retirada do desempenho e das Revisões porque seu Gabarito não pôde ser confirmado.
_Avoid_: Pergunta inválida, descartada

**Etapa**:
Cada tipo de trabalho do motor que usa o Claude: extração de Tópicos, classificação de Trechos, geração de Perguntas, resolução às cegas e julgamento de Contestação. Cada Etapa tem um modelo configurável e um consumo medido.
_Avoid_: Passo, fase, step

**Resposta**:
O que o usuário respondeu a uma Pergunta, que pode ser "Não sei", junto com seu resultado (acerto ou erro) e sua Confiança.
_Avoid_: Tentativa, submissão

**Confiança**:
A declaração do usuário de que, ao responder, tinha certeza ou estava em dúvida (chutou). Um acerto em dúvida vale menos que um acerto com certeza. "Não sei" conta como erro.
_Avoid_: Certeza, nível de segurança
