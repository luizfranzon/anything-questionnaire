# 20: Métricas de consumo

**What to build:** Uma tela de Métricas mostra, por Etapa e ao longo do tempo, os tokens consumidos e o custo estimado em US$ (calculado na consulta a partir da tabela de preços), além da taxa de acerto do cache e dos totais do período (tokens de entrada, de saída, lidos do cache, gravados no cache e custo). Filtros por período, Estudo e Etapa permitem investigar um gasto específico.

**Blocked by:** 19 (Configurações: modelos e preços).

**Status:** ready-for-agent

- [ ] O gráfico mostra tokens e custo por Etapa ao longo do tempo
- [ ] O custo é calculado a partir da tabela de preços vigente
- [ ] A taxa de acerto do cache aparece por Etapa
- [ ] Os totais do período aparecem com cada tipo de token e o custo
- [ ] Os filtros por período, Estudo e Etapa podem ser combinados
- [ ] Testes pela interface do motor cobrem as agregações, o cálculo de custo e a taxa de cache a partir de registros de consumo conhecidos
