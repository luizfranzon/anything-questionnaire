import { z } from "zod";

/** Prompts and output schemas shared by every adapter, so the Method of access never changes what Claude is asked. */

export const TopicsSchema = z.object({ topics: z.array(z.string()) });

export const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      alternatives: z.array(z.object({ text: z.string(), explanation: z.string() })),
      correctIndex: z.number().int(),
    }),
  ),
});

export const BlindResolutionSchema = z.object({ answers: z.array(z.number().int().nullable()) });

export const BLIND_RESOLUTION_SYSTEM = `Você resolve Perguntas de múltipla escolha de forma independente.

Regras:
- Para cada Pergunta, escolha a Alternativa que você considera correta, com base no conhecimento atual e correto do assunto.
- "answers" tem um item por Pergunta, na mesma ordem do pedido: a posição (a partir de 0) da Alternativa escolhida.
- Use null só se nenhuma Alternativa for defensável ou se mais de uma for igualmente correta.`;

export const TOPIC_EXTRACTION_SYSTEM = `Você ajuda alguém a estudar um assunto. Dado o Objetivo do estudo, proponha a lista de Tópicos em que o assunto se divide.

Regras:
- Entre 5 e 15 Tópicos, cada um uma subdivisão distinta do assunto, sem sobreposição.
- Cubra tudo o que o assunto cobra, não só o que o Objetivo menciona explicitamente.
- Nomes curtos (até 80 caracteres), em português, mantendo termos técnicos no original quando fizer sentido.`;

export const QUESTION_GENERATION_SYSTEM = `Você escreve Perguntas de múltipla escolha para quem está estudando um assunto.

Regras:
- Escreva sempre em português, mantendo termos técnicos no original quando fizer sentido.
- Cada Pergunta tem de 4 a 5 Alternativas, exatamente uma correta, e uma só resposta defensável. Evite "todas as anteriores" e "nenhuma das anteriores".
- "correctIndex" é a posição (a partir de 0) da Alternativa correta. Varie essa posição entre as Perguntas.
- A "explanation" de cada Alternativa diz por que ela está certa ou por que está errada, de forma concreta.
- As Perguntas do pedido cobrem aspectos diferentes do Tópico e não repetem umas às outras.
- Use o conhecimento atual e correto do assunto. O Objetivo do estudo dá o foco e o nível de exigência.
- O pedido traz a Dificuldade: "fácil" cobra conceitos e definições centrais; "média" cobra aplicação em cenários comuns; "difícil" cobra cenários com várias restrições, exceções e distratores plausíveis. A Dificuldade muda a exigência da Pergunta, nunca a clareza do enunciado nem a existência de uma só resposta correta.`;


export const topicExtractionMessage = (goal: string) => `Objetivo do estudo:\n${goal}`;

export const questionGenerationMessage = (goal: string, topicName: string, count: number) =>
  `Objetivo do estudo:\n${goal}\n\nTópico: ${topicName}\n\nEscreva ${count} ${count === 1 ? "Pergunta" : "Perguntas"} sobre este Tópico.`;

export const blindResolutionMessage = (questions: Array<{ prompt: string; alternatives: string[] }>) =>
  questions
    .map((q, i) => `Pergunta ${i + 1}: ${q.prompt}\n${q.alternatives.map((a, j) => `  ${j}. ${a}`).join("\n")}`)
    .join("\n\n");
