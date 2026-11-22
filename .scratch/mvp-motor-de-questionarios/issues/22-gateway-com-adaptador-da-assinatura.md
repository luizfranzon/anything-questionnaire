# 22: Gateway com adaptador da assinatura

**What to build:** Um segundo adaptador real da porta do gateway do Claude, que usa a assinatura do usuário através do Claude Agent SDK, ao lado do adaptador da Messages API (ADR 0004). Cada chamada é de um turno só, sem ferramentas e sem acesso a arquivos, com saída estruturada validada por schema, para que o Claude veja só o que o código mandou (ADR 0002). Os erros do SDK (credencial inválida, limite de uso, rede) são mapeados para os mesmos erros tipados do adaptador da API. O consumo reportado pelo SDK é registrado, e os campos que ele não informar são guardados como ausentes, não como zero. A imagem do Docker passa a incluir o que o SDK precisa para rodar.

**Blocked by:** 02 (Proposta e aprovação de Tópicos).

**Status:** ready-for-agent

- [ ] O adaptador da assinatura implementa a mesma porta do gateway, com uma operação por Etapa e entrada e saída tipadas
- [ ] A credencial é passada ao SDK por variável de ambiente do processo (`CLAUDE_CODE_OAUTH_TOKEN`), nunca por login interativo
- [ ] Cada chamada é de um turno só, com ferramentas desabilitadas e sem acesso ao sistema de arquivos
- [ ] Erros de credencial inválida ou expirada, de limite de uso (com o horário de renovação quando o SDK informar) e de rede viram erros tipados, iguais nos dois adaptadores
- [ ] O registro de consumo aceita campos ausentes (ex.: tokens de cache) distintos de zero
- [ ] Confirmado na documentação da Anthropic o que vale hoje para o uso do Agent SDK em planos de assinatura (crédito mensal próprio a partir de 15/06/2026, termos de uso pessoal) e registrado como comentário neste ticket
- [ ] Testes pela interface do motor cobrem o mapeamento de erros e o registro de consumo com campos ausentes, usando o gateway falso, mais um teste de contrato do adaptador contra um SDK simulado
