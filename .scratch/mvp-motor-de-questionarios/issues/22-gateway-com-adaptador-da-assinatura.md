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

## Comentário: o que a documentação da Anthropic diz hoje (pesquisado em 2026-11-22)

- **Crédito mensal do Agent SDK a partir de 15/06/2026: pausado.** A página de suporte "Use the Claude Agent SDK with your Claude plan" diz que as mudanças anunciadas no uso do SDK foram suspensas e que, por ora, nada mudou. Logado com o plano, o uso do SDK e do `claude -p` continua saindo do limite da assinatura. Os créditos mensais de API (Max US$ 100, Ultra US$ 200, Team) cobrem o SDK **só** quando ele roda com chave de API de uma organização do Console ligada. Pro não tem esses créditos. A própria página tem datas inconsistentes, então vale reler antes de depender disso. Isso muda a premissa da ADR 0004: no modo assinatura o limite é o da assinatura, e não um crédito próprio.
- **`claude setup-token`:** gera um token OAuth de 1 ano para scripts e CI, impresso no terminal e não salvo. Vai em `CLAUDE_CODE_OAUTH_TOKEN`. Exige plano Pro, Max, Ultra, Team ou Enterprise. O token só faz requisições de modelo (sem Remote Control e sem conectores do claude.ai).
- **Não confirmado: termos de uso pessoal.** Nenhuma das páginas encontradas diz se rodar o Agent SDK com a assinatura pessoal, dentro de um app próprio, é permitido. A documentação de GitHub Actions só recomenda chave de API para segredos compartilhados, porque o token é ligado à assinatura de quem o gerou. Antes de depender disso, conferir os Termos de Serviço ao Consumidor e a política de uso do Agent SDK. Por isso a chave de API continua como plano B (ADR 0004).

Fontes: [Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [Authentication (Claude Code)](https://code.claude.com/docs/en/authentication), [API credits for Max, Ultra, and Team](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers).
