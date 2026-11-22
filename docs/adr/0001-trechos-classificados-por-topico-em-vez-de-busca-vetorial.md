# Trechos classificados por Tópico em vez de busca vetorial

Mandar todas as Fontes em cada geração sairia caro: o cache do prompt expira entre sessões de estudo, então cada primeira Rodada pagaria o Estudo inteiro de novo. Um RAG clássico (busca por semelhança de embeddings) seria aproximado e traria Trechos irrelevantes ou deixaria passar os relevantes. Como os Tópicos de um Estudo são uma lista fechada aprovada pelo usuário, decidimos que, na ingestão, o Claude marca cada Trecho com os Tópicos a que pertence. A geração de Perguntas de um Tópico usa um filtro exato pelos Trechos marcados com ele, e o Claude complementa com o próprio conhecimento.

## Consequences

- Aprovar um Tópico novo exige reclassificar os Trechos existentes do Estudo.
- Os embeddings (pgvector, modelo local) existem no projeto, mas servem para detectar Perguntas duplicadas, e não para escolher Trechos.
