# 24: Credencial expirada e limite de uso

**What to build:** Quando uma chamada ao Claude falha porque a Credencial é inválida ou expirou, o app mostra um aviso que leva ao wizard de setup, sem perder o trabalho em andamento. Quando a assinatura atinge o limite de uso, o app para sem tentar de novo, mostra uma mensagem clara (com o horário de renovação quando o SDK informar) e mantém no Estoque as Perguntas que já passaram pela verificação, de modo que a próxima Rodada começa por elas. O app nunca troca de Método de acesso sozinho.

**Blocked by:** 23 (Credenciais e wizard de setup), 08 (Rodada abandonada, retomada e Estoque).

**Status:** ready-for-agent

- [ ] Uma falha de credencial inválida ou expirada mostra um aviso com link para o wizard, e o trabalho que estava na fila fica retomável depois de renovar a Credencial
- [ ] Um limite de uso atingido interrompe a geração sem novas tentativas e mostra a mensagem com o horário de renovação, quando houver
- [ ] As Perguntas já verificadas antes da interrupção vão para o Estoque e são usadas na Rodada seguinte
- [ ] Nenhum Método de acesso alternativo é usado automaticamente, mesmo que haja uma chave de API configurada
- [ ] Testes pela interface do motor cobrem os dois erros com o gateway falso, incluindo a preservação do Estoque

## Design system

O aviso de credencial expirada e a mensagem de limite de uso devem usar os componentes de `packages/ui` (checklist em `packages/ui/COMPONENTS.md`, regras em `DESIGN.md`), como `InlineAlert` e `Toast` (e `Button` em link para o wizard), com tokens por papel e sem estilos soltos. Erro e aviso nunca só por cor, sempre com ícone (Lucide). Se faltar um componente, crie-o em `packages/ui` pelo processo do `COMPONENTS.md`, com aprovação do usuário, em vez de improvisar na tela.
