# 01: Esqueleto e Estudos

**What to build:** O projeto sobe inteiro com um único Docker Compose (app TanStack Start e Postgres com pgvector), exposto só em localhost. Na tela, o usuário cria um Estudo com nome e Objetivo, vê a lista de Estudos, edita e exclui. Esta fatia estabelece o motor de domínio, independente do framework, com uma interface pública chamada por server functions finas, além da persistência com Drizzle e migrations versionadas e da estrutura de testes da costura principal: a interface do motor testada contra um Postgres real, com um banco descartável por execução.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] O Docker Compose sobe o app e o Postgres (imagem com pgvector), com volumes para os dados e para os arquivos das Fontes, e o app fica acessível só em localhost
- [ ] A chave da API da Anthropic é lida de variável de ambiente, e há um arquivo de exemplo documentando as variáveis
- [ ] As migrations do Drizzle rodam automaticamente (ou com um comando documentado) ao subir
- [ ] O motor expõe operações para criar, listar, editar e excluir Estudo, e as server functions só delegam a ele
- [ ] As telas de lista de Estudos e de criação/edição de Estudo funcionam
- [ ] A suíte de testes roda contra um Postgres real com um banco isolado por execução, e cobre as operações de Estudo pela interface do motor
- [ ] Há um comando documentado para rodar os testes
