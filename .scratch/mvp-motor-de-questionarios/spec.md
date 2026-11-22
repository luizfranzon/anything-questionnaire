# Spec: MVP do motor de questionários

Status: ready-for-agent

## Problem Statement

Quem estuda um assunto (uma certificação, um concurso, um tema técnico) não tem um jeito prático de transformar o próprio material (PDFs, anotações, páginas, vídeos) num treino de perguntas que se adapte ao que ainda não sabe. Montar questionários à mão dá trabalho, e os bancos de questões prontos não usam o material da pessoa nem acompanham onde ela erra. Sem esse acompanhamento, ela gasta o tempo revisando o que já domina e só descobre os pontos fracos e o que esqueceu na hora da prova. E perguntas geradas por IA trazem um risco a mais: um Gabarito errado ensina a pessoa a errar, e o modelo tende a concordar com ela quando ela contesta, mesmo estando certo.

## Solution

Uma aplicação web pessoal (sem login, rodando em Docker) em que o usuário cria um **Estudo** a partir de um **Objetivo** e, opcionalmente, de **Fontes** (texto, PDF, imagem, TXT/MD, DOCX, página de site, vídeo do YouTube). O Claude propõe uma lista de **Tópicos**, que o usuário revisa e aprova. A partir daí, o usuário gera **Rodadas** com a quantidade de **Perguntas** de múltipla escolha que quiser. As Perguntas usam os **Trechos** das Fontes como foco e o conhecimento do Claude como complemento, e passam por verificação às cegas antes de chegar ao usuário.

Cada **Resposta** (com **Confiança** e a opção "Não sei") alimenta o **Desempenho** por Tópico e a repetição espaçada (FSRS). As Rodadas seguintes trazem mais Perguntas novas dos Tópicos fracos e as **Revisões** vencidas. O usuário pode **contestar** um Gabarito, e a reavaliação é protegida contra bajulação. Uma tela de Configurações define o modelo de cada **Etapa**, e uma tela de Métricas mostra tokens, custo e uso de cache por Etapa.

## User Stories

### Estudo e Objetivo

1. Como estudante, quero criar um Estudo informando só um Objetivo em linguagem natural, para começar a treinar mesmo sem ter material próprio.
2. Como estudante, quero dar um nome ao Estudo, para encontrá-lo depois na lista de Estudos.
3. Como estudante, quero ver a lista dos meus Estudos com um resumo de cada um (Tópicos, Revisões vencidas, última Rodada), para escolher onde continuar.
4. Como estudante, quero editar o Objetivo de um Estudo, para ajustar o foco conforme meu estudo evolui.
5. Como estudante, quero excluir um Estudo, para remover assuntos que abandonei.

### Fontes

6. Como estudante, quero colar um texto como Fonte, para usar anotações que já tenho.
7. Como estudante, quero enviar um PDF como Fonte (inclusive escaneado), para gerar Perguntas a partir de apostilas e livros.
8. Como estudante, quero enviar imagens (prints, fotos de anotações, slides) como Fonte, para aproveitar material que não está em texto.
9. Como estudante, quero enviar arquivos TXT, Markdown e DOCX como Fonte, para usar documentos que já tenho.
10. Como estudante, quero informar a URL de uma página como Fonte, para estudar a partir de artigos e documentação online.
11. Como estudante, quero informar o link de um vídeo do YouTube como Fonte, para que as legendas do vídeo virem material de estudo.
12. Como estudante, quero que a legenda manual do vídeo seja preferida e a automática seja usada só quando não houver manual, para ter o texto mais fiel possível.
13. Como estudante, quero ser avisado quando um vídeo não tem legenda, para não ficar com uma Fonte vazia.
14. Como estudante, quero ser avisado quando uma página não pode ser baixada (login, bloqueio), com a sugestão de colar o texto, para ter uma alternativa.
15. Como estudante, quero que o conteúdo de uma página seja capturado uma única vez ao ser adicionado, para que meu Estudo não mude sozinho se a página mudar.
16. Como estudante, quero que só o conteúdo principal da página seja usado (sem menu nem rodapé), para que as Perguntas não tratem de ruído.
17. Como estudante, quero acompanhar o progresso do processamento de uma Fonte (baixando, extraindo, classificando), para saber quando ela está pronta.
18. Como estudante, quero que o processamento de uma Fonte continue mesmo se eu fechar a aba ou o container reiniciar, para não precisar adicioná-la de novo.
19. Como estudante, quero que falhas passageiras da API sejam tentadas de novo automaticamente, para não refazer uma ingestão inteira por um erro momentâneo.
20. Como estudante, quero ver as Fontes de um Estudo com tipo, nome e situação, para saber o que está alimentando as Perguntas.
21. Como estudante, quero remover uma Fonte, para tirar material que não uso mais ou que está errado.
22. Como estudante, ao remover uma Fonte que originou Perguntas, quero escolher entre mantê-las (padrão) ou arquivá-las, porque o motivo da remoção muda o que faz sentido.

### Tópicos

23. Como estudante, quero que o Claude proponha uma lista de Tópicos a partir do Objetivo e das Fontes, para não precisar montar a estrutura do assunto sozinho.
24. Como estudante, quero que o Claude sugira Tópicos que o assunto cobra mas meu material não cobre, para não deixar lacunas.
25. Como estudante, quero renomear, juntar, apagar e adicionar Tópicos na proposta antes de aprovar, para direcionar o estudo ao que me interessa.
26. Como estudante, quero que as Perguntas só sejam classificadas dentro da lista de Tópicos aprovada, para que o Desempenho por Tópico seja confiável.
27. Como estudante, ao adicionar uma Fonte nova a um Estudo existente, quero que o Claude proponha só os Tópicos novos para eu aprovar, para não revisar tudo de novo.
28. Como estudante, quero que os Trechos sejam reclassificados quando eu aprovar um Tópico novo, para que o novo Tópico tenha o material correspondente.
29. Como estudante, quero renomear um Tópico mantendo todo o histórico, para corrigir nomes sem perder dados.
30. Como estudante, quero juntar dois Tópicos somando Perguntas, Trechos, Respostas e Desempenho, para corrigir uma divisão que ficou fina demais.
31. Como estudante, quero arquivar um Tópico para que ele saia das Rodadas sem perder o histórico, para deixar de estudar algo sem apagar o que fiz.
32. Como estudante, quero reativar um Tópico arquivado, para voltar a estudá-lo se ele passar a ser cobrado.

### Rodadas e geração

33. Como estudante, quero criar uma Rodada escolhendo a quantidade de Perguntas, para ajustar o treino ao tempo que tenho.
34. Como estudante, quero escolher o Modo da Rodada (estudo ou simulado), para alternar entre aprender e me testar.
35. Como estudante, quero opcionalmente restringir a Rodada a alguns Tópicos, para focar no que quero treinar hoje.
36. Como estudante, quero que as Perguntas novas venham com mais peso dos Tópicos com Desempenho baixo, para melhorar meus pontos fracos.
37. Como estudante, quero que Tópicos nunca perguntados tenham prioridade, para que o motor meça antes de julgar.
38. Como estudante, quero que Tópicos fortes continuem aparecendo com um peso mínimo, para detectar esquecimento.
39. Como estudante, quero que as Revisões vencidas ocupem até 30% da Rodada, completando o resto com Perguntas novas, para equilibrar fixação e conteúdo novo.
40. Como estudante, quero que as Perguntas do Estoque sejam usadas antes de gerar Perguntas novas, para não pagar por Perguntas que já existem.
41. Como estudante, quero que a Dificuldade das Perguntas suba nos Tópicos em que vou bem, para que eles não fiquem fáceis demais.
42. Como estudante, quero que as Perguntas sejam geradas a partir dos Trechos dos Tópicos sorteados mais o conhecimento do Claude, para ter foco no meu material sem ficar limitado a ele.
43. Como estudante, quero Perguntas sobre Tópicos que não têm nenhum Trecho, geradas só pelo conhecimento do Claude, para cobrir o assunto inteiro.
44. Como estudante, quero que as Perguntas venham sempre em português, mantendo os termos técnicos no original quando fizer sentido.
45. Como estudante, quero que o Claude não gere Perguntas novas que repetem, com outras palavras, Perguntas que já existem, para que Revisão disfarçada não distorça o treino.
46. Como estudante, quero ver o progresso da geração da Rodada, para saber quanto falta.
47. Como estudante, quero que a Rodada só comece quando todas as Perguntas estiverem prontas e verificadas, para não ter interrupções no meio.
48. Como estudante, quero que a geração continue se eu fechar a aba, e que a Rodada esteja pronta quando eu voltar.

### Verificação de Gabaritos

49. Como estudante, quero que cada Pergunta gerada passe por uma resolução às cegas antes de chegar a mim, para reduzir Gabaritos errados.
50. Como estudante, quero que Perguntas cuja resolução às cegas não bate com o Gabarito sejam descartadas e substituídas, para não receber Perguntas ambíguas ou erradas.
51. Como estudante, quero que o Claude possa corrigir o que minha Fonte diz quando ela estiver errada ou desatualizada, para não aprender informação errada.
52. Como estudante, quero que a Explicação avise quando o Gabarito diverge do que minha Fonte diz, para eu entender a discrepância.

### Respondendo

53. Como estudante, quero responder escolhendo uma Alternativa, para avançar rápido.
54. Como estudante, quero ter a opção "Não sei", para não precisar chutar.
55. Como estudante, quero informar se tinha certeza ou se chutei, para que acertos no chute não inflem meu Desempenho.
56. Como estudante, no modo estudo, quero ver logo após cada Resposta se acertei, o Gabarito e a Explicação, para corrigir o entendimento enquanto a dúvida está fresca.
57. Como estudante, no modo simulado, quero informar a Confiança junto com a Resposta e ver a correção completa só no fim, para treinar como numa prova.
58. Como estudante, quero que a Explicação diga por que a Alternativa certa está certa e por que cada errada está errada, para aprender com o erro.
59. Como estudante, quero que a Explicação mostre de qual Fonte e Trecho a Pergunta veio (página do PDF, link do site, minuto do vídeo, quando der), para saber onde estudar mais.
60. Como estudante, quero que a Explicação indique quando a Pergunta veio só do conhecimento do Claude, para saber como ela foi embasada.
61. Como estudante, quero abrir o Trecho de origem com um clique, para reler o contexto.
62. Como estudante, quero que as Alternativas venham embaralhadas em cada Revisão, para não decorar a posição da resposta.
63. Como estudante, quero que cada Resposta conte no Desempenho e no FSRS assim que eu responder, para não perder nada se eu parar no meio.

### Rodadas abandonadas e Estoque

64. Como estudante, quero retomar uma Rodada que deixei no meio, para continuar de onde parei.
65. Como estudante, quero ver na página do Estudo que existe uma Rodada em andamento (por exemplo, 8/20), para lembrar de terminá-la.
66. Como estudante, quero que criar uma Rodada nova encerre a que está em andamento, sem contar as Perguntas não respondidas como erro.
67. Como estudante, quero que as Perguntas não vistas de uma Rodada encerrada vão para o Estoque, para serem aproveitadas depois.

### Contestação

68. Como estudante, quero contestar o Gabarito de uma Pergunta explicando por que discordo, para corrigir erros do Claude.
69. Como estudante, quero que a reavaliação comece com uma resolução às cegas, sem o Gabarito original nem minha opinião, para medir o que o Claude acha sem pressão.
70. Como estudante, quero que um juiz compare as duas posições anonimizadas, sem saber qual é a minha nem que existe uma contestação, para que o resultado não seja bajulação.
71. Como estudante, quero que o juiz só corrija o Gabarito citando evidência (Trecho ou fonte da web), para que um argumento convincente não baste.
72. Como estudante, quero que, se o Gabarito for corrigido, minha Resposta seja reavaliada como acerto e o Desempenho recalculado.
73. Como estudante, quero que, se o Gabarito for mantido, eu receba a explicação do porquê.
74. Como estudante, quero que, se não houver evidência suficiente, a Pergunta seja anulada e saia do Desempenho e das Revisões, para que dúvidas não contaminem meu histórico.
75. Como estudante, quero acompanhar a situação da Contestação (em análise, mantida, corrigida, anulada).

### Acompanhamento do aprendizado

76. Como estudante, quero ver os Tópicos do Estudo ordenados do mais fraco para o mais forte, com a barra de Desempenho, para saber onde focar.
77. Como estudante, quero ver a tendência de cada Tópico (subindo ou caindo nas últimas Rodadas), para saber se estou melhorando.
78. Como estudante, quero ver quantas Perguntas respondi em cada Tópico, para saber o quanto o Desempenho é confiável.
79. Como estudante, quero ver quantas Revisões estão vencidas hoje e começar uma Rodada a partir disso, para manter a repetição espaçada em dia.
80. Como estudante, quero ver o histórico de Rodadas com data, Modo e acertos/total, para acompanhar minha evolução.
81. Como estudante, quero abrir uma Rodada passada e ver cada Pergunta com minha Resposta, o Gabarito e a Explicação, para rever o que errei.
82. Como estudante, quero navegar pelo banco de Perguntas do Estudo, filtrando por Tópico, por resultado (errei, chutei, acertei) e por situação (ativa, anulada, contestada, arquivada), para estudar de forma dirigida.

### Configurações

83. Como estudante, quero escolher o modelo do Claude de cada Etapa (extração de Tópicos, classificação de Trechos, geração de Perguntas, resolução às cegas, julgamento de Contestação), para equilibrar qualidade e custo.
84. Como estudante, quero que todas as Etapas usem o Opus 5.5 por padrão, para começar com a melhor qualidade.
85. Como estudante, quero editar a tabela de preços por modelo, para que o custo estimado continue certo quando os preços mudarem.
86. Como estudante, quero ajustar os parâmetros do motor (janela de Respostas recentes, peso mínimo dos Tópicos fortes, fração de Revisão, limite de Perguntas existentes enviadas na geração), para calibrar o comportamento.

### Métricas de consumo

87. Como estudante, quero ver os tokens consumidos por Etapa num gráfico ao longo do tempo, para saber onde estou gastando.
88. Como estudante, quero ver o custo estimado em US$ por Etapa, para saber onde está o dinheiro, e não só os tokens.
89. Como estudante, quero ver a taxa de acerto do cache por Etapa, para perceber se o caching está funcionando ou se algo o quebrou.
90. Como estudante, quero filtrar as métricas por período, Estudo e Etapa, para investigar um gasto específico.
91. Como estudante, quero ver os totais do período (tokens de entrada, de saída, lidos do cache, gravados no cache e custo), para ter uma visão geral.

### Operação

92. Como estudante, quero subir a aplicação inteira com um único Docker Compose (app e Postgres), para não precisar instalar nada além do Docker.
93. Como estudante, quero que meus dados e arquivos de Fontes sobrevivam a reinícios e atualizações dos containers, para não perder meu histórico.
94. Como estudante, quero configurar minha chave da API da Anthropic por variável de ambiente, para não expô-la na interface.
95. Como estudante, quero que a aplicação seja exposta só em localhost, já que ela não tem login.

## Implementation Decisions

### Arquitetura geral

- Aplicação TanStack Start com React. Toda a regra de negócio fica num **motor** de domínio, independente do framework. As server functions do TanStack Start são uma camada fina que chama a interface pública do motor.
- O motor depende de **portas** para tudo que é externo, e cada porta tem um adaptador real e um falso:
  - **Gateway do Claude**: uma operação por Etapa, com entrada e saída tipadas. O adaptador real usa o Anthropic SDK com a Messages API e saída estruturada validada por schema.
  - **Captura de Fontes**: baixar a página e extrair o conteúdo principal, obter as legendas do YouTube, extrair texto de PDF, DOCX, TXT/MD e imagem.
  - **Embeddings**: modelo local multilíngue (multilingual-e5-small ou equivalente) rodando no processo do app via transformers.js.
  - **Armazenamento de arquivos**: disco num volume do Docker.
  - **Relógio**.
- Usamos a Messages API, e não o Claude Agent SDK, porque o motor é um fluxo determinado pelo código (ADR 0003).
- Docker Compose com dois serviços: o app e o Postgres, usando a imagem com pgvector. Um volume guarda os dados do Postgres e outro os arquivos das Fontes. O app é exposto só em localhost. A chave da API vem por variável de ambiente.
- Persistência com Drizzle e migrations versionadas.
- Os trabalhos longos rodam numa **fila persistida no Postgres** (pg-boss), com tentativa automática e status consultável: ingestão de Fonte, proposta de Tópicos, classificação de Trechos, geração de Rodada e reavaliação de Contestação. A interface consulta esse status para mostrar o progresso.

### Modelo de dados (entidades e relações principais)

- **Estudo**: nome e Objetivo. Tem Fontes, Tópicos, Rodadas e Perguntas.
- **Fonte**: tipo (texto, PDF, imagem, TXT/MD, DOCX, site, YouTube), origem (nome do arquivo ou URL), referência ao arquivo guardado e/ou ao conteúdo capturado, situação do processamento.
- **Trecho**: pertence a uma Fonte. Tem o texto e uma localização (página, âncora ou minuto do vídeo, quando houver). Relação N:N com Tópico.
- **Tópico**: pertence a um Estudo. Tem nome e situação (ativo ou arquivado). A junção de Tópicos move todas as associações para o Tópico de destino.
- **Rodada**: pertence a um Estudo. Tem quantidade, Modo, filtro opcional de Tópicos, situação (gerando, pronta, em andamento, concluída, encerrada) e a lista ordenada de Perguntas apresentadas.
- **Pergunta**: pertence a um Estudo e a um Tópico. Tem formato (só múltipla escolha no MVP, mas o modelo comporta resposta aberta), enunciado, Alternativas, Gabarito, Explicação, Dificuldade, situação (ativa, anulada ou arquivada), vínculos com os Trechos/Fontes de origem (vazio quando veio só do conhecimento do Claude), embedding do enunciado e estado do FSRS. Uma Pergunta gerada e nunca apresentada faz parte do Estoque.
- **Resposta**: pertence a uma Pergunta e a uma Rodada. Tem a Alternativa escolhida ou "Não sei", a Confiança (certeza ou dúvida), o resultado e a data. O resultado é modelado de forma que possa ganhar nuances (acerto parcial) quando a resposta aberta existir.
- **Contestação**: pertence a uma Pergunta (e à Resposta contestada). Tem o argumento do usuário, a situação (em análise, mantida, corrigida, anulada), a resposta da resolução às cegas, o veredito e a evidência citada pelo juiz.
- **Registro de consumo**: um por chamada ao Claude. Guarda Etapa, modelo, Estudo, Rodada (quando houver), tokens de entrada, de saída, lidos do cache e gravados no cache, e a data. O custo é calculado na consulta a partir da tabela de preços.
- **Configurações**: modelo por Etapa, tabela de preços por modelo e parâmetros do motor.

### Interface pública do motor (operações)

- Criar, editar, listar e excluir Estudo.
- Adicionar Fonte (enfileira a ingestão) e remover Fonte (com a escolha de manter ou arquivar as Perguntas originadas).
- Obter a proposta de Tópicos e aprová-la (com edições). Renomear, juntar, arquivar e reativar Tópico.
- Criar Rodada (enfileira a geração), obter a Rodada e a próxima Pergunta, registrar Resposta e encerrar Rodada.
- Contestar Pergunta (enfileira a reavaliação).
- Consultas: Desempenho por Tópico com tendência, Revisões vencidas, histórico de Rodadas, detalhe de uma Rodada, banco de Perguntas com filtros, situação dos trabalhos em andamento e métricas de consumo agregadas.
- Ler e alterar as Configurações.

### Ingestão de Fontes e Tópicos

- O conteúdo da Fonte é capturado uma única vez, ao ser adicionada. Para o YouTube, a ordem de preferência é a legenda manual e depois a automática, e a ausência de legenda resulta em falha clara.
- O conteúdo extraído é dividido em Trechos, mantendo a localização quando disponível.
- **Extração de Tópicos**: a Etapa recebe o Objetivo e o conteúdo das Fontes e devolve a proposta de Tópicos, incluindo Tópicos que o assunto cobra mas as Fontes não cobrem. Num Estudo que já tem Tópicos, ela propõe só os novos.
- **Classificação de Trechos**: a Etapa marca cada Trecho com zero ou mais Tópicos da lista aprovada. Ela roda após a aprovação e de novo quando um Tópico novo é aprovado (ADR 0001).
- As Fontes não são autoridade absoluta: o conhecimento do Claude complementa e pode corrigir o conteúdo delas.

### Composição e geração da Rodada

- Ordem de preenchimento: (1) Revisões vencidas, até a fração de Revisão (padrão 30%); (2) Perguntas do Estoque dos Tópicos sorteados; (3) Perguntas novas geradas.
- O sorteio de Tópicos para as Perguntas novas usa pesos derivados do Desempenho, considerando só os Tópicos ativos e, se houver, o filtro da Rodada:
  - Desempenho calculado sobre as Respostas recentes (janela padrão: últimas 10 por Tópico).
  - Um acerto em dúvida vale menos que um acerto com certeza. "Não sei" conta como erro.
  - Tópicos sem nenhuma Resposta têm prioridade.
  - Todo Tópico ativo tem um peso mínimo (padrão 10%).
- A Dificuldade de cada Pergunta nova é definida pelo motor a partir do Desempenho do Tópico.
- **Geração de Perguntas**: a Etapa recebe, para cada Tópico sorteado, os Trechos marcados com ele (se houver), os enunciados existentes do Tópico (até o limite configurado, padrão 50, os mais recentes) com a instrução de cobrir outros aspectos, a Dificuldade e a instrução de complementar com o conhecimento do Claude, escrever em português e citar os Trechos usados. Ela devolve as Perguntas com Alternativas, Gabarito, Explicação (que inclui um aviso quando o Gabarito diverge da Fonte) e os Trechos de origem.
- **Filtro de duplicadas**: cada Pergunta gerada recebe um embedding, e as que forem parecidas demais com uma Pergunta existente do mesmo Estudo são descartadas e geradas de novo.
- **Resolução às cegas na geração**: a Etapa recebe só os enunciados e as Alternativas (sem os Gabaritos), num único pedido para o lote. Perguntas em que a resposta às cegas não bate com o Gabarito são descartadas e geradas de novo (ADR 0002).
- A Rodada só fica pronta quando atinge a quantidade pedida com Perguntas verificadas.
- O prompt caching é usado onde o prefixo é estável (instruções do sistema e Trechos), e a ordem do conteúdo nas chamadas é pensada para preservá-lo.

### Respostas, FSRS e Rodadas abandonadas

- Cada Resposta é gravada e afeta o Desempenho e o FSRS assim que é dada.
- Mapeamento para o FSRS (via `ts-fsrs`): erro ou "Não sei" vira "Errei", acerto em dúvida vira "Difícil", acerto com certeza vira "Bom".
- Todas as Perguntas respondidas entram no agendamento de Revisão. As anuladas e arquivadas, e as de Tópicos arquivados, ficam fora.
- As Alternativas são embaralhadas em cada apresentação.
- No modo estudo, o resultado, o Gabarito e a Explicação são liberados logo após a Resposta. No modo simulado, só quando a Rodada termina, e a Confiança é informada junto com a Resposta.
- Criar uma Rodada nova encerra a que estiver em andamento. As Perguntas novas não apresentadas voltam para o Estoque, e as Revisões não apresentadas continuam com o agendamento que tinham.

### Contestação (ADR 0002)

- Etapa 1, **resolução às cegas**: recebe só o enunciado e as Alternativas, sem o Gabarito e sem o argumento do usuário. Pode usar busca na web.
- Etapa 2, **julgamento**: o juiz recebe a Pergunta e duas posições anonimizadas, cada uma com resposta e argumento (o argumento do usuário e a Explicação original), em ordem que não revela a origem, mais o resultado da resolução às cegas e os Trechos relevantes. Ele não sabe que existe uma contestação nem qual posição é do usuário, e deve decidir citando evidência. Pode usar busca na web.
- Regra de decisão:
  - O juiz escolhe a posição do usuário com evidência: o Gabarito é corrigido, a Resposta é reavaliada como acerto e o Desempenho e o FSRS são recalculados.
  - O juiz escolhe a posição original: o Gabarito é mantido e a justificativa é mostrada ao usuário.
  - Não há evidência suficiente, ou a resolução às cegas e o juiz apontam para uma terceira Alternativa: a Pergunta é anulada.
- Enquanto a Contestação está em análise, a Pergunta fica fora das Revisões.

### Alterações de Estudo com histórico

- Juntar Tópicos move Perguntas, vínculos de Trechos e Respostas para o Tópico de destino, e o Desempenho passa a refletir o histórico somado.
- Arquivar um Tópico tira o Tópico e suas Perguntas das Rodadas, sem apagar nada. Reativar reverte isso.
- Remover uma Fonte apaga seus Trechos e o arquivo guardado. As Perguntas originadas são mantidas (padrão) ou arquivadas, conforme a escolha do usuário. As Perguntas mantidas perdem o vínculo com Trechos que não existem mais.

### Telas

- Lista de Estudos.
- Criação de Estudo.
- Página do Estudo:
  - Tópicos com Desempenho, tendência e número de Respostas.
  - Revisões vencidas, com atalho para criar Rodada.
  - Rodada em andamento.
  - Histórico de Rodadas.
  - Banco de Perguntas com filtros.
  - Fontes, com situação do processamento.
  - Gestão de Tópicos.
- Revisão e aprovação da proposta de Tópicos.
- Criação de Rodada (quantidade, Modo, filtro de Tópicos) e tela de progresso da geração.
- Tela de Pergunta: Alternativas, "Não sei", Confiança, correção com Explicação e referência ao Trecho, botão de contestar.
- Resultado da Rodada (resumo e, no modo simulado, a correção completa) e detalhe de Rodada passada.
- Configurações: modelo por Etapa, tabela de preços, parâmetros do motor.
- Métricas de consumo: gráfico de tokens e custo por Etapa ao longo do tempo, taxa de cache, totais, filtros por período, Estudo e Etapa.

## Testing Decisions

- **Um bom teste** exercita comportamento externo pela interface pública do motor e verifica resultados observáveis (o que as consultas do motor devolvem depois das operações). Não verifica detalhes internos, como a estrutura de tabelas, chamadas a funções privadas ou o texto exato dos prompts.
- **Costura principal (única)**: a interface pública do motor, testada contra um **Postgres real** (o mesmo do Docker Compose, com um banco descartável por execução), sem mock de banco. Regras importantes moram em consultas (Desempenho, Estoque, Revisões vencidas, junção de Tópicos).
- **As dependências externas entram como adaptadores falsos** das portas:
  - **Gateway do Claude falso**, com respostas roteirizadas por Etapa. Permite simular: proposta de Tópicos, classificação de Trechos, lotes de Perguntas, resolução às cegas que diverge do Gabarito, juiz que corrige, mantém ou anula, e erro de sobrecarga com nova tentativa.
  - **Captura de Fontes falsa**: conteúdo fixo, vídeo sem legenda, página bloqueada.
  - **Embeddings falsos**: vetores determinísticos que permitem simular duplicadas.
  - **Relógio controlável**: avançar dias para testar Revisões vencidas e FSRS.
- A fila (pg-boss) é exercitada nos testes. Os trabalhos são processados de forma síncrona ou drenados antes das verificações.
- **Comportamentos prioritários** para cobrir:
  - Composição da Rodada: fração de Revisão, prioridade do Estoque, sorteio ponderado, prioridade de Tópicos nunca perguntados, peso mínimo, filtro de Tópicos, Tópicos arquivados excluídos.
  - Cálculo do Desempenho: janela recente, peso da Confiança, "Não sei" como erro.
  - Mapeamento para o FSRS e Revisões vencidas ao longo do tempo.
  - Descarte e regeneração de Perguntas reprovadas na resolução às cegas ou detectadas como duplicadas.
  - Os três desfechos da Contestação e seus efeitos no Desempenho e nas Revisões.
  - O juiz não recebe informação que identifique a posição do usuário (verificado pelo que o gateway falso recebeu).
  - Rodada abandonada: Respostas contam, Perguntas não vistas vão para o Estoque.
  - Juntar, arquivar e reativar Tópicos.
  - Remover Fonte com manter ou arquivar as Perguntas.
  - Registro e agregação do consumo e do custo por Etapa.
- **Testes de contrato dos adaptadores reais** (Anthropic SDK, download e extração de página, legendas do YouTube, extração de PDF e DOCX): poucos e separados da suíte principal, rodados sob demanda, porque custam dinheiro ou dependem da rede.
- **A interface fica sem testes automatizados no MVP**, porque a regra está no motor.
- **Prior art**: nenhum. O repositório é novo, e esta spec estabelece o padrão.

## Out of Scope

- Login, múltiplos usuários e deploy público (o app é pessoal e roda em localhost).
- Perguntas de resposta aberta e verdadeiro/falso (o modelo de dados já comporta a resposta aberta, mas o MVP só gera e corrige múltipla escolha).
- Crawl de sites (seguir links). No MVP, cada URL é uma página.
- Busca na web durante a geração de Perguntas (a busca entra só na Contestação).
- Sugestões de leitura externa na Explicação.
- Rodada só de Revisão e fração de Revisão ajustável por Rodada.
- Início antecipado da Rodada pelas Revisões e geração em lotes progressivos.
- Gráfico de evolução do Desempenho por Tópico ao longo do tempo.
- Tópicos compartilhados entre Estudos.
- Escolha do idioma das Perguntas (sempre em português).
- Testes automatizados de interface (Playwright ou equivalente).

## Further Notes

- O vocabulário segue o `GLOSSARY.md`, e as decisões arquiteturais estão nos ADRs 0001 (Trechos classificados por Tópico em vez de busca vetorial), 0002 (Gabarito verificado às cegas contra bajulação) e 0003 (Messages API em vez do Agent SDK).
- O modelo padrão de todas as Etapas é o Opus 5.5. Os modelos atuais rejeitam forçar o uso de ferramenta e o prefill, então a saída estruturada deve usar o recurso de formato de saída da API. Os prompts e os parâmetros devem seguir a documentação atual da API, e não padrões antigos.
- Perguntas geradas por IA são o ponto de maior risco de qualidade. A resolução às cegas na geração e o mecanismo de Contestação existem para proteger o Desempenho, que é o coração do produto.
- Uma fatia inicial sugerida, de ponta a ponta: criar um Estudo só com Objetivo, aprovar Tópicos, gerar uma Rodada (com verificação às cegas), responder no modo estudo e ver o Desempenho. Fontes, Contestação, Métricas e o restante entram em fatias seguintes.
