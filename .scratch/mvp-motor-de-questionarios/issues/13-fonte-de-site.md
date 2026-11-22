# 13: Fonte de site

**What to build:** O usuário informa a URL de uma página como Fonte. A página é baixada uma única vez, só o conteúdo principal é extraído (sem menu nem rodapé), e ela segue o fluxo de Trechos, Tópicos e classificação. Se a página exigir login ou bloquear o download, o usuário recebe um aviso sugerindo colar o texto. A referência na Explicação mostra o link da página.

**Blocked by:** 11 (Fonte de texto, Trechos e referência na Explicação).

**Status:** ready-for-agent

- [ ] Uma URL vira Fonte, com o conteúdo capturado uma única vez (mudanças posteriores na página não afetam o Estudo)
- [ ] Só o conteúdo principal é extraído
- [ ] Páginas bloqueadas ou com login deixam a Fonte com situação de erro e a sugestão de colar o texto
- [ ] A referência na Explicação mostra o link da página
- [ ] Testes pela interface do motor cobrem o sucesso e o bloqueio com o adaptador falso, e há teste de contrato separado para o adaptador real
