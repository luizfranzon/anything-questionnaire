# Componentes do design system

Checklist de progresso. Uma sessão por componente, sempre junto com o usuário. Atualize este arquivo ao fechar cada sessão.

## Como começar uma sessão de componente

1. Ler `DESIGN.md` (raiz), `packages/ui/src/styles/tokens.css` e `packages/ui/src/motion/index.tsx`.
2. Ler o `Button` (`src/components/Button/`) como modelo de estrutura: `X.tsx`, `X.css`, `X.stories.tsx`.
3. Pegar o próximo item `[ ]` da lista abaixo e confirmar o escopo (variantes e estados) com o usuário **antes** de desenhar.
4. Criar o componente com todos os estados na matriz (normal, hover, pressionado, foco, desabilitado, carregando quando couber, selecionado quando couber), versão sobre fundo escuro quando fizer sentido.
5. Micro animações com `motion` usando os presets de `src/motion` (`snappy`, `soft`, `fade`), respeitando movimento reduzido.
6. Só tokens por papel (`var(--color-...)`), nunca valor solto. Sem emojis; ícones só Lucide.
7. Conferir: `pnpm exec tsc --noEmit`, abrir o Storybook (`pnpm storybook` em `packages/ui`, porta 6006) e olhar o render.
8. Mostrar ao usuário, esperar aprovação, marcar `[x]` aqui e anotar decisões novas na seção Decisões em `DESIGN.md`.

Regras de interação, resumo: cartão com borda só escurece a borda no hover (tinta para forest); selecionado tem fundo `fill-1` e borda 2px sem mudar o peso da fonte; ação primária é a pílula menta, só uma por tela; foco só por teclado (anel forest 3px); acerto e erro nunca só por cor, sempre com ícone.

Legenda: `[x]` aprovado · `[~]` feito, aguardando aprovação · `[ ]` a fazer

---

## 1. Primitivos

- [x] **Button** — primário, secundário, destrutivo, link, `onDark`, ícone, carregando. Aprovado em 22/11.
- [x] **TextInput / Textarea / NumberInput** — campo com rótulo, ajuda e erro (tickets 01, 11, 13, 14, 17, 19, 21). Caixa e rodapé compartilhados em `Field`. Aprovado em 22/11.
- [x] **Select** — modelo por Etapa e filtros (tickets 10, 19, 20). Aprovado em 22/11.
- [x] **Checkbox / RadioGroup** — Modo da Rodada, manter ou arquivar Perguntas (tickets 07, 15). Itens compartilhados em `Choice`. Aprovado em 22/11.
- [x] **Badge / StatusTag** — situação de Fonte, Pergunta e Contestação (tickets 10, 11, 17). Aprovado em 22/11.
- [x] **Spinner / Skeleton** — carregando listas e páginas. Aprovado em 22/11.
- [x] **ProgressBar** (aprovado em 22/11) — geração da Rodada, processamento de Fonte, Desempenho (tickets 02, 03, 05, 11)
- [x] **Tabs** — navegação dentro da página do Estudo. Aprovado em 22/11.
- [x] **Pagination** (aprovado em 22/11) — banco de Perguntas (ticket 10)
- [x] **Tooltip** — aprovado em 22/11.
- [x] **Dialog / ConfirmDialog** — excluir Estudo, remover Fonte (tickets 01, 15). Aprovado em 22/11. Usa o `CloseButton` compartilhado.
- [x] **Toast / InlineAlert** — erros de Fonte, avisos (tickets 11, 13, 14). Aprovado em 22/11.
- [x] **EmptyState** — aprovado em 22/11.
- [x] **FileDropzone** — PDF, imagem, DOCX, TXT, MD (tickets 11, 12). Aprovado em 22/11.

## 2. Responder uma Pergunta (núcleo do produto)

- [x] **AlternativeOption** — neutra, hover, selecionada, certa, errada, desabilitada, somente leitura (simulado), atalho 1 a 4. Aprovado em 22/11.
- [x] **ConfidencePicker** — "Tinha certeza" / "Chutei", neutro; fundo claro (simulado) e `onDark` (painel de correção); desabilitado por "Não sei", erro ao gravar, somente leitura. Setas e Tab (`radiogroup`). Aprovado em 22/11 (tickets 03, 07)
- [x] **QuestionCard** — Tópico, posição, marca de Revisão, enunciado, Alternativas, "Não sei" e "Responder"; carregando, não carregou, anulada, erro ao gravar; Confiança e correção pelo slot `footer`. Aprovado em 22/11 (tickets 03, 07)
- [x] **RoundProgress** — pontos até 30 Perguntas, barra contínua acima disso, sempre com "8/20"; só indicador (`role="progressbar"`), sem resultado por ponto. Aprovado em 22/11 (tickets 03, 08)
- [x] **CorrectionPanel** (era `ExplanationPanel`) — painel forest: resultado, Explicação por Alternativa, origem clicável ou "conhecimento geral", aviso de divergência, `ConfidencePicker` `onDark` após acerto, "Contestar"/situação da Contestação e "Próxima"/"Ver resultado"; variante `readOnly` (tickets 03, 11, 17). Aprovado em 22/11.
- [x] **SourceExcerptViewer** — abre o Trecho de origem sobre o `Dialog`; carregando, não carregou, Fonte removida (ticket 11). Aprovado em 22/11.
- [x] **RoundResult** — acertos/total, por Tópico, "Ver correção" e "Nova Rodada"; carregando e erro (tickets 03, 07). Aprovado em 22/11.
- [x] **ReviewList** — correção completa do simulado e Rodada passada; linhas que abrem no lugar, filtro Todas/Erradas, Rodada encerrada, anulada (tickets 07, 09). Aprovado em 22/11.
- [x] **ContestationForm / ContestationStatus** — modal sobre `Dialog` e situação em fundo claro: em análise, mantida, corrigida, anulada (ticket 17). Aprovado em 22/11.

## 3. Estudo, Tópicos e Fontes

- [x] **StudyCard** — resumo na lista de Estudos (ticket 01). Aprovado em 22/11.
- [x] **TopicRow** — nome, barra de Desempenho, tendência, nº de Respostas (ticket 05). Aprovado em 22/11.
- [x] **TrendIndicator** — aprovado em 22/11.
- [x] **TopicProposalEditor** — modos `proposal` (apagar, ticket 02) e `managed` (arquivar e reativar, ticket 16); renomear, juntar, adicionar. Aprovado em 22/11.
- [x] **IconButton** (novo, compartilhado) — botão só de ícone usado por `StudyCard` e `TopicProposalEditor`. Aprovado em 22/11.
- [x] **SourceRow** — tipo, nome e situação; remover com manter ou arquivar Perguntas (tickets 11 a 15). Aprovado em 22/11.
- [x] **SourceAddForm** — texto, arquivo, site, YouTube; recolhível (tickets 11 a 14). Aprovado em 22/11.
- [x] **IngestionProgress** — baixando, extraindo, classificando; versão `compact` (ticket 11). Aprovado em 22/11.
- [x] **RoundInProgressBanner** — "Rodada em andamento: 8/20" com retomada (ticket 08). Aprovado em 22/11.
- [x] **RoundHistoryRow** (ticket 09). Aprovado em 22/11.
- [x] **QuestionBankFilters / QuestionBankRow** — filtros combináveis e linha que abre no lugar com Gabarito, Explicação e histórico (ticket 10). Aprovado em 22/11.
- [ ] **StreakIndicator / AnswerCount** — sequência de dias e perguntas respondidas. Falta ticket novo (ver Open questions em `DESIGN.md`).

## 4. Configurações e Métricas

- [x] **StageModelSelect** (ticket 19) — `Settings/`: `Select` por Etapa com ajuda, "Restaurar" o modelo padrão, gravando, não gravou, desabilitado. Aprovado em 22/11.
- [x] **PriceTable** editável (ticket 19) — `Settings/`: entrada, saída, leitura e gravação de cache em US$ por 1M; carregando, vazia, gravando, erro por linha, campo vazio, somente leitura. Aprovado em 22/11.
- [x] **ParameterField** com validação de faixa (ticket 21) — `Settings/`: sobre `NumberInput`, faixa sempre visível, padrão e "Restaurar"; fora da faixa, vazio, gravando, não gravou, desabilitado. Aprovado em 22/11.
- [x] **StatTile** — totais do período (ticket 20) — `Metrics/`: normal, destaque (custo), carregando, não carregou, zerado. Aprovado em 22/11.
- [x] **TokenCostChart** — tokens e custo por Etapa ao longo do tempo (ticket 20) — `Metrics/`: colunas empilhadas, Tokens/Custo, tooltip, tabela equivalente, 90 dias, carregando, recarregando, vazio, não carregou. Novos tokens `--color-chart-1..5`. Aprovado em 22/11.
- [x] **CacheHitRate** (ticket 20) — `Metrics/`: uma barra por Etapa, "Sem cache", carregando, recarregando, vazio, não carregou. Aprovado em 22/11.
- [x] **FilterBar** — período, Estudo, Etapa (ticket 20) — `Metrics/`: Período pelo `DateRangePicker`, "Limpar filtros", carregando, desabilitado. Aprovado em 22/11.
- [x] **RangeCalendar / DateRangePicker** (novo, pedido do usuário) — `DateRange/`: calendário de período em dois cliques com prévia e campo com atalhos (Hoje, 7, 30, 90 dias); substitui o Período e as datas do `FilterBar`. Sem futuro, `min`/`max` opcionais, teclado completo. Aprovado em 22/11.

## 5. Estrutura das telas

- [x] **AppShell** — barra superior (Estudos, Métricas, Configurações), variante `focus` para responder e larguras `reading`/`content`/`wide`. Aprovado em 22/11.
- [x] **PageHeader** — voltar, título, descrição, selos e ações; carregando. Aprovado em 22/11.

## Depois dos componentes

Telas em `packages/ui/src/screens/`, grupo "Telas" no Storybook, montadas só com componentes deste pacote. Uma tela por vez, com a lista de estados aprovada antes.

- [x] **1. Lista de Estudos** (ticket 01) — padrão, vazio, um Estudo, muitos, texto longo, primeira carga, recarga, não carregou, excluir (confirmar, gravando, erro, interativo). Aprovado em 22/11.
- [~] **2. Criação e edição de Estudo** — criar e editar; vazio, preenchido, erros de validação, gravando, erro ao gravar, texto longo, edição carregando e não carregou. Aguardando aprovação.
- [~] **3. Proposta de Tópicos** — gerando, nova tentativa automática, falhou, para revisar, incremental, aprovando, erro ao aprovar. Aguardando aprovação.
- [~] **4. Página do Estudo** — cinco abas (Tópicos, Rodadas, Perguntas, Fontes, Gerenciar Tópicos), banner de Rodada, Revisões vencidas, Tópicos por aprovar, estados vazios e de carga por aba. Aguardando aprovação.
- [~] **5. Criação de Rodada e geração** — formulário, validação, Rodada em andamento, enviando, erro; geração com progresso, nova tentativa, falhou e pronta. Aguardando aprovação.
- [~] **6. Pergunta (estudo e simulado)** — estudo (todos os desfechos, Contestação, Trecho de origem) e simulado, carregando, não carregou e anulada. Aguardando aprovação.
- [~] **7. Resultado da Rodada** — estudo, simulado, com Não sei, tudo certo ou errado, muitos Tópicos, carregando e erro. Aguardando aprovação.
- [~] **8. Detalhe de Rodada passada** — simulado, estudo, encerrada, 40 Perguntas, Trecho, Contestação, carregando e erro. Aguardando aprovação.
- [~] **9. Configurações** — modelos, preços e parâmetros; valores alterados, fora da faixa, gravando e erro por campo, carregando e não carregou. Aguardando aprovação.
- [~] **10. Métricas** — padrão, tabela, filtrado, recarregando, carregando, não carregou e sem consumo. Aguardando aprovação.

## Pendências de decisão

- Ticket novo para sequência de dias.
