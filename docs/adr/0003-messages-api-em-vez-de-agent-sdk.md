# Messages API (`@anthropic-ai/sdk`) em vez do Claude Agent SDK

O motor é um fluxo determinado pelo código, com Etapas conhecidas (extrair Tópicos, classificar Trechos, gerar Perguntas, resolução às cegas, juiz) e entrada e saída estruturadas em cada uma. Usamos chamadas diretas à Messages API, e não um agente autônomo, porque a defesa contra a bajulação (ADR 0002) depende de controlar exatamente o que cada chamada vê, e porque o consumo é medido e configurado por Etapa.
