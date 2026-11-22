# 12: Fontes de arquivo: PDF, imagem e DOCX

**What to build:** O usuário envia PDFs (inclusive escaneados), imagens (prints, fotos de anotações, slides) e DOCX como Fonte. Os arquivos ficam guardados no volume do Docker, por uma porta de armazenamento de arquivos, e o conteúdo é extraído e dividido em Trechos com localização (página do PDF, quando houver), seguindo o mesmo fluxo de proposta de Tópicos e classificação da fatia 11.

**Blocked by:** 11 (Fonte de texto, Trechos e referência na Explicação).

**Status:** ready-for-agent

- [ ] O upload aceita PDF, imagem e DOCX
- [ ] Os arquivos ficam no volume por uma porta de armazenamento
- [ ] PDFs com texto e PDFs escaneados são extraídos (o Claude lê PDF e imagem nativamente), e os Trechos guardam a página
- [ ] Imagens e DOCX viram Trechos
- [ ] A referência na Explicação mostra a página do PDF quando houver
- [ ] Falhas de extração deixam a Fonte com situação de erro e mensagem clara
- [ ] Testes pela interface do motor cobrem cada tipo com o adaptador falso, e há testes de contrato separados (sob demanda) para os extratores reais
