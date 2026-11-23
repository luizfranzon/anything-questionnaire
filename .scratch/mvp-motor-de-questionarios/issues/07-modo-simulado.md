# 07: Modo simulado

**What to build:** Ao criar uma Rodada, o usuário escolhe o Modo: estudo (correção a cada Resposta, como já funciona) ou simulado. No modo simulado, a Confiança é informada junto com a Resposta, antes de o usuário saber se acertou, e o resultado, os Gabaritos e as Explicações só aparecem quando a Rodada termina, numa correção completa.

**Blocked by:** 03 (Rodada no modo estudo).

**Status:** done

- [x] A criação de Rodada permite escolher o Modo (padrão: estudo)
- [x] No modo simulado, a tela de Pergunta pede a Alternativa (ou "Não sei") e a Confiança juntas, sem revelar o resultado
- [x] O motor não devolve resultado, Gabarito nem Explicação de uma Rodada em modo simulado antes do fim
- [x] Ao terminar, a tela mostra a correção completa com cada Pergunta, a Resposta, o Gabarito e a Explicação
- [x] As Respostas do modo simulado alimentam o Desempenho e o FSRS como no modo estudo
- [x] Testes pela interface do motor cobrem que nada da correção vaza antes do fim e que tudo é liberado ao terminar
