# 23: Credenciais e wizard de setup

**What to build:** Um wizard de setup em que o usuário escolhe o Método de acesso (assinatura ou chave de API) e informa a Credencial. Na assinatura, o wizard instrui a rodar `claude setup-token` no computador do usuário (que precisa ter o Claude Code instalado) e a colar o token. Na chave de API, o usuário cola a chave. Ao salvar, o app faz uma chamada mínima real ao Claude, com o modelo mais barato disponível e poucos tokens, e só grava a Credencial se passar. Se falhar, mostra o motivo (token inválido, expirado, assinatura sem acesso ao modelo, sem rede) e deixa tentar de novo. A Credencial é guardada cifrada no Postgres, com uma chave mestra gerada na primeira execução e mantida no volume de arquivos. Se a variável de ambiente existir, ela tem prioridade sobre o valor guardado. Na primeira execução, o wizard bloqueia todas as telas até existir uma Credencial válida, e depois fica acessível em Configurações para trocar de Método de acesso ou renovar o token. A chamada de validação não entra nas Métricas.

**Blocked by:** 22 (Gateway com adaptador da assinatura), 19 (Configurações: modelos e preços).

**Status:** ready-for-agent

- [ ] Na primeira execução sem Credencial, qualquer tela redireciona ao wizard
- [ ] O wizard oferece os dois Métodos de acesso e, na assinatura, mostra a instrução do `claude setup-token` com um campo para colar o token
- [ ] A Credencial só é gravada depois de uma chamada mínima real bem-sucedida, e a falha mostra o motivo e permite tentar de novo
- [ ] A Credencial fica cifrada no Postgres, a chave mestra fica no volume de arquivos e a Credencial nunca é devolvida inteira à interface (só mascarada)
- [ ] A variável de ambiente tem prioridade sobre a Credencial guardada, e o wizard indica quando é ela que está em uso
- [ ] O wizard é acessível em Configurações para trocar de Método de acesso ou renovar a Credencial
- [ ] A chamada de validação não gera registro de consumo
- [ ] Testes pela interface do motor cobrem o bloqueio sem Credencial, a gravação só após validação, a prioridade da variável de ambiente e a troca de Método de acesso, usando o gateway falso e um Postgres real

## Design system

O design system já está pronto em `packages/ui` (checklist em `packages/ui/COMPONENTS.md`, regras em `DESIGN.md`). As telas reais do wizard devem ser montadas com esses componentes, e não com HTML ou estilos soltos. Pontos de partida: `AppShell` (variante `focus` para o wizard bloqueante), `PageHeader`, `RadioGroup`/`Choice` para escolher o Método de acesso, `TextInput` (via `Field`) para colar o token ou a chave, `Button` (uma única ação primária por tela), `InlineAlert` para o motivo da falha de validação, `Spinner` durante a chamada de validação e `Dialog`/`ConfirmDialog` ao trocar de Método de acesso. Só tokens por papel (`var(--color-...)`), foco só por teclado, sem emojis e ícones só Lucide. Se faltar um componente específico (por exemplo, indicador de passos do wizard ou campo de segredo mascarado), ele não deve ser improvisado na tela: deve ser criado em `packages/ui` seguindo o processo do `COMPONENTS.md` (escopo e estados confirmados com o usuário, Storybook, aprovação) e registrado lá.
