# 25: Métricas no modo assinatura

**What to build:** A tela de Métricas passa a funcionar nos dois Métodos de acesso. No modo assinatura, o custo em US$ aparece rotulado como "equivalente em API", para deixar claro que não é uma cobrança real. Os campos que o SDK não reportar (ex.: tokens de cache) aparecem como "indisponível", e não como zero, e não entram em somas nem na taxa de acerto do cache como se fossem zero.

**Blocked by:** 20 (Métricas de consumo), 22 (Gateway com adaptador da assinatura).

**Status:** ready-for-agent

- [ ] As Métricas mostram tokens por Etapa nos dois Métodos de acesso
- [ ] No modo assinatura, o custo é rotulado como "equivalente em API"
- [ ] Campos ausentes aparecem como "indisponível", e a taxa de acerto do cache só considera chamadas que reportaram cache
- [ ] Testes pela interface do motor cobrem os totais com chamadas dos dois Métodos de acesso misturadas, incluindo campos ausentes

## Design system

Os rótulos "equivalente em API" e "indisponível" entram nos componentes de Métricas que já existem em `packages/ui` (`StatTile`, `TokenCostChart`, `CacheHitRate`, `FilterBar`; ver `packages/ui/COMPONENTS.md` e `DESIGN.md`). Se algum deles não comportar o estado "indisponível" ou o rótulo, estenda o componente em `packages/ui` pelo processo do `COMPONENTS.md` (escopo e estados confirmados com o usuário, Storybook, aprovação), e não o contorne na tela. Só tokens por papel, sem emojis e ícones só Lucide.
