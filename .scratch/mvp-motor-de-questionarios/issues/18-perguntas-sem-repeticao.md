# 18: Perguntas sem repetição

**What to build:** As Perguntas novas deixam de repetir, com outras palavras, Perguntas que já existem. Na geração, cada Tópico sorteado leva os enunciados existentes (até um limite, padrão 50, os mais recentes), com a instrução de cobrir outros aspectos. Depois de geradas, as Perguntas recebem um embedding de um modelo local multilíngue (por exemplo, multilingual-e5-small via transformers.js, no processo do app), e as que ficarem parecidas demais com uma Pergunta existente do mesmo Estudo (busca no pgvector) são descartadas e geradas de novo. Esta fatia introduz a porta de embeddings.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** ready-for-agent

- [ ] A geração envia os enunciados existentes de cada Tópico sorteado, respeitando o limite
- [ ] Cada Pergunta gravada guarda o embedding do enunciado no pgvector
- [ ] Perguntas acima do limiar de semelhança com uma existente do mesmo Estudo são descartadas e substituídas
- [ ] O modelo de embeddings roda localmente, sem serviço externo, e o download do modelo fica num volume ou na imagem
- [ ] Os valores (limite de enunciados, limiar de semelhança) ficam centralizados para depois virarem Configurações
- [ ] Testes pela interface do motor cobrem o envio dos enunciados (pelo gateway falso) e o descarte de duplicadas (com embeddings falsos determinísticos)
