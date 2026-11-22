# 15: Remover Fonte

**What to build:** O usuário remove uma Fonte de um Estudo. Os Trechos e o arquivo guardado são apagados. Se a Fonte originou Perguntas, o app informa quantas e pergunta se elas devem ser mantidas (padrão) ou arquivadas. As Perguntas mantidas continuam ativas e perdem o vínculo com os Trechos apagados. As Perguntas arquivadas saem das Rodadas e do Desempenho, com o histórico mantido.

**Blocked by:** 11 (Fonte de texto, Trechos e referência na Explicação).

**Status:** ready-for-agent

- [ ] Remover uma Fonte apaga seus Trechos e o arquivo guardado
- [ ] Antes de remover, o app mostra quantas Perguntas a Fonte originou e oferece manter (padrão) ou arquivar
- [ ] As Perguntas mantidas continuam ativas e não quebram a referência na Explicação
- [ ] As Perguntas arquivadas saem das Rodadas, das Revisões e do Desempenho, mas continuam no histórico e no banco de Perguntas
- [ ] Testes pela interface do motor cobrem as duas escolhas e seus efeitos
