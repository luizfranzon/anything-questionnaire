# 14: Fonte do YouTube

**What to build:** O usuário informa o link de um vídeo do YouTube como Fonte. As legendas do vídeo viram o conteúdo da Fonte, preferindo a legenda manual e usando a automática quando não houver manual. O texto vira Trechos com o minuto do vídeo, e a referência na Explicação leva ao vídeo no minuto correspondente. Vídeo sem nenhuma legenda gera aviso, e não uma Fonte vazia.

**Blocked by:** 11 (Fonte de texto, Trechos e referência na Explicação).

**Status:** ready-for-agent

- [ ] Um link do YouTube vira Fonte a partir das legendas
- [ ] A legenda manual é preferida, e a automática é usada quando não há manual
- [ ] Os Trechos guardam o minuto, e a referência na Explicação abre o vídeo no minuto correspondente
- [ ] Vídeo sem legenda deixa a Fonte com situação de erro e mensagem clara
- [ ] Testes pela interface do motor cobrem a preferência de legenda e a ausência de legenda com o adaptador falso, e há teste de contrato separado para o adaptador real
