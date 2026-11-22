# Dois Métodos de acesso ao Claude: assinatura (Agent SDK) e chave de API (Messages API)

O app roda em Docker e não compartilha o login do Claude Code do computador do usuário. O usuário já paga uma assinatura Claude e quer usá-la em vez de pagar por token. O token da assinatura (gerado por `claude setup-token`, usado como `CLAUDE_CODE_OAUTH_TOKEN`) é aceito pelo Claude Code e pelo Agent SDK. Não confirmamos que a Messages API o aceite, então o caminho da assinatura passa pelo Agent SDK.

Por isso o gateway do Claude passa a ter dois adaptadores atrás da mesma porta, e o **Método de acesso** é escolhido no wizard de setup: **assinatura** (Agent SDK) ou **chave de API** (Messages API). Este ADR complementa o ADR 0003, que continua valendo para o caminho da chave de API. O que muda é que a Messages API deixa de ser o único caminho.

O controle exigido pelo ADR 0002 se mantém no adaptador da assinatura: cada chamada é de um turno só, sem ferramentas, sem acesso a arquivos e com saída estruturada, de modo que o Claude vê apenas o que o código mandou.

## Consequences

- O consumo medido por Etapa é o que cada adaptador consegue reportar. O Agent SDK pode não informar tokens de cache. As Métricas mostram "indisponível" nesses campos, e o custo no modo assinatura é rotulado como "equivalente em API".
- A assinatura tem limite de uso. Ao atingi-lo, o app para, avisa e preserva o Estoque, sem trocar de Método de acesso por conta própria.
- A Credencial é guardada cifrada no Postgres. A variável de ambiente, quando existe, tem prioridade.
- A documentação da Anthropic indica que, a partir de 15/06/2026, o uso do Agent SDK em planos de assinatura consome um crédito mensal próprio, separado do limite interativo. Isso vale ser verificado no ticket 22, porque define o tamanho real do limite do modo assinatura.

## Considered Options

- Só assinatura via Agent SDK: rejeitado, para manter a chave de API como plano B e não depender de uma política que pode mudar.
- Só chave de API: rejeitado, porque o usuário quer usar a assinatura que já paga.
- Wizard que roda `claude setup-token` dentro do container: rejeitado por ser frágil (depende da saída de uma CLI interativa). O wizard instrui o usuário a rodar o comando no próprio computador e colar o token.
